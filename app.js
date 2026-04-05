require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_API_KEY);
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const app = express();

app.use(cors({ origin: process.env.FRONT_END_URL }));
app.use(express.json());
const PORT = process.env.PORT || 5000;

const PAYMENT_CONFIRMATION_URL = `${process.env.FRONT_END_URL}/payment-confirmation`;

// ==========================================
// 1. CONFIGURAÇÃO DO SWAGGER
// ==========================================
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Pagamentos Stripe",
      version: "1.0.0",
      description: "Documentação da API para criação de sessões de checkout",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`, // Ajuste para sua URL de produção depois
      },
    ],
  },
  // ATENÇÃO: Coloque aqui o nome exato do arquivo onde estão as rotas (ex: './index.js' ou './server.js')
  apis: ["./index.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Servindo a interface do Swagger na rota /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ==========================================
// 2. ROTAS E DOCUMENTAÇÃO JSDOC
// ==========================================

/**
 * @swagger
 * /create-checkout-session:
 *   post:
 *     summary: Cria uma sessão de checkout no Stripe
 *     description: Recebe um array de produtos no body e retorna a URL de redirecionamento para o pagamento seguro no Stripe.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Camiseta Dev"
 *                     imageUrl:
 *                       type: string
 *                       example: "https://meusite.com/imagem.jpg"
 *                     price:
 *                       type: number
 *                       example: 89.90
 *                     quantity:
 *                       type: integer
 *                       example: 1
 *     responses:
 *       200:
 *         description: Sessão criada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: "https://checkout.stripe.com/pay/cs_test_..."
 *       500:
 *         description: Erro interno no servidor ou na integração com o Stripe.
 */
app.post("/create-checkout-session", async (req, res) => {
  try {
    console.log(req.body);
    const items = req.body.products.map((product) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: product.name,
          images: [product.imageUrl],
        },
        unit_amount: parseInt(`${product.price}00`),
      },
      quantity: product.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      line_items: items,
      mode: "payment",
      success_url: `${PAYMENT_CONFIRMATION_URL}?success=true`,
      cancel_url: `${PAYMENT_CONFIRMATION_URL}?canceled=true`,
    });

    res.send({ url: session.url });
  } catch (error) {
    console.error("Erro no checkout:", error);
    res.status(500).json({ error: "Falha ao criar sessão de pagamento." });
  }
});

app.listen(PORT, () => console.log(`Running on port ${PORT}`));
