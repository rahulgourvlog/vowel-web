import express from "express";
import prisma from "../db.server.js";
import shopify from "../shopify.server.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.post("/", async (req, res) => {
  const { title, description, price, vendor } = req.body;

  try {
    const session = await shopify.sessionStorage.loadSession(req);
    const client = new shopify.api.clients.Rest(
      session.shop,
      session.accessToken,
    );

    const shopifyResponse = await client.post({
      path: "products",
      data: {
        product: {
          title,
          body_html: description,
          vendor,
          variants: [{ price }],
        },
      },
      type: "application/json",
    });

    const createdProduct = shopifyResponse.body.product;

    const product = await prisma.product.create({
      data: {
        id: createdProduct.id.toString(),
        title: createdProduct.title,
        description: createdProduct.body_html,
        price: parseFloat(createdProduct.variants[0].price),
        vendor: createdProduct.vendor,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, price, vendor } = req.body;

  try {
    const session = await shopify.sessionStorage.loadSession(req);
    const client = new shopify.api.clients.Rest(
      session.shop,
      session.accessToken,
    );

    await client.put({
      path: `products/${id}`,
      data: {
        product: {
          title,
          body_html: description,
          vendor,
          variants: [{ price }],
        },
      },
      type: "application/json",
    });

    const product = await prisma.product.update({
      where: { id },
      data: { title, description, price, vendor },
    });

    res.status(200).json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const session = await shopify.sessionStorage.loadSession(req);
    const client = new shopify.api.clients.Rest(
      session.shop,
      session.accessToken,
    );

    await client.delete({ path: `products/${id}` });

    await prisma.product.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
