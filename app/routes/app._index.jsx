import { useEffect, useState } from "react";
import { useFetcher } from "@remix-run/react";
import Polaris from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
const { Page, Layout, Card, DataTable, Button, Modal, TextField, Stack } =
  Polaris;

export const loader = async ({ request }) => {
  const baseUrl = new URL(request.url).origin;
  const response = await fetch(`${baseUrl}/api/products`, {
    method: "GET",
  });
  const products = await response.json();
  return { products };
};

export const action = async ({ request }) => {
  const baseUrl = new URL(request.url).origin;
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "create") {
    const newProduct = {
      title: formData.get("title"),
      description: formData.get("description"),
      price: formData.get("price"),
      vendor: formData.get("vendor"),
    };

    await fetch(`${baseUrl}/api/products`, {
      method: "POST",
      body: JSON.stringify(newProduct),
    });
  } else if (actionType === "edit") {
    const productId = formData.get("id");
    const updatedProduct = {
      title: formData.get("title"),
      description: formData.get("description"),
      price: formData.get("price"),
      vendor: formData.get("vendor"),
    };

    await fetch(`${baseUrl}/api/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(updatedProduct),
    });
  } else if (actionType === "delete") {
    const productId = formData.get("id");
    await fetch(`/api/products/${productId}`, {
      method: "DELETE",
    });
  }

  return null;
};

export default function ProductManagement() {
  const fetcher = useFetcher();
  const [products, setProducts] = useState([]);
  const [modalActive, setModalActive] = useState(false);
  const [formState, setFormState] = useState({
    id: "",
    title: "",
    description: "",
    price: "",
    vendor: "",
  });

  useEffect(() => {
    fetcher.load(`/api/products`);
  }, []);

  useEffect(() => {
    if (fetcher.data) {
      setProducts(fetcher.data.products);
    }
  }, [fetcher.data]);

  const toggleModal = () => setModalActive(!modalActive);

  const handleFormChange = (field, value) => {
    setFormState({ ...formState, [field]: value });
  };

  const handleSubmit = (actionType) => {
    const formData = new FormData();
    Object.keys(formState).forEach((key) => {
      formData.append(key, formState[key]);
    });
    formData.append("actionType", actionType);

    fetcher.submit(formData, { method: "post" });
    toggleModal();
  };

  const rows = products.map((product) => [
    product.title,
    product.description,
    product.image ? (
      <img src={product.image} alt={product.title} style={{ width: "50px" }} />
    ) : (
      "N/A"
    ),
    product.price,
    product.vendor,
    <Button onClick={() => handleFormChange("id", product.id)}>Edit</Button>,
    <Button destructive onClick={() => handleSubmit("delete")}>
      Delete
    </Button>,
  ]);

  return (
    <Page title="Product Management">
      <Layout>
        <Layout.Section>
          <Card title="Product List" sectioned>
            <DataTable
              columnContentTypes={[
                "text",
                "text",
                "text",
                "text",
                "text",
                "text",
              ]}
              headings={[
                "Title",
                "Description",
                "Image",
                "Price",
                "Vendor",
                "Actions",
              ]}
              rows={rows}
            />
          </Card>
          <Button primary onClick={toggleModal}>
            Add Product
          </Button>
        </Layout.Section>
      </Layout>

      {modalActive && (
        <Modal
          open={modalActive}
          onClose={toggleModal}
          title="Add/Edit Product"
          primaryAction={{
            content: "Save",
            onAction: () => handleSubmit(formState.id ? "edit" : "create"),
          }}
        >
          <Modal.Section>
            <Stack vertical>
              <TextField
                label="Title"
                value={formState.title}
                onChange={(value) => handleFormChange("title", value)}
              />
              <TextField
                label="Description"
                value={formState.description}
                onChange={(value) => handleFormChange("description", value)}
              />
              <TextField
                label="Price"
                type="number"
                value={formState.price}
                onChange={(value) => handleFormChange("price", value)}
              />
              <TextField
                label="Vendor"
                value={formState.vendor}
                onChange={(value) => handleFormChange("vendor", value)}
              />
            </Stack>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}
