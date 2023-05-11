async function fetchFormatAndOutput(path, options = {}) {
  try {
    const response = await fetch(`/${path}`, options);
    const data = await response.json();
    console.log("fetch data:", data);
    const outputContainer = document.getElementById("output-container");
    outputContainer.innerText = "";
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.id = "output-json";
    code.innerText = JSON.stringify(data, null, 2);
    pre.appendChild(code);
    outputContainer.appendChild(pre);
  } catch (error) {
    console.log(error);
  }
}

const paths = ["customers"];

paths.forEach((path) => {
  const navLinks = document.getElementById("nav-links");
  const link = document.createElement("a");
  link.href = `/${path}`;
  link.innerText = `/${path}`;
  navLinks.appendChild(link);

  const navButtons = document.getElementById("nav-buttons");
  const button = document.createElement("button");
  button.id = `${path}`;
  button.innerText = `/${path}`;
  button.addEventListener("click", (event) =>
    fetchFormatAndOutput(event.target.id)
  );
  navButtons.appendChild(button);
});

const getCustomersByIdSubmit = document.getElementById(
  "form-get-customers-byid-submit"
);
getCustomersByIdSubmit.addEventListener("click", async () => {
  try {
    getCustomersByIdSubmit.disabled = true;

    const customerId = document.getElementById(
      "form-get-customers-byid-id"
    ).value;

    await fetchFormatAndOutput(`customers/${customerId}`);

    getCustomersByIdSubmit.disabled = false;
  } catch (error) {
    console.log(error);
  }
});

const getCustomersByCitySubmit = document.getElementById(
  "form-get-customers-bycity-submit"
);
getCustomersByCitySubmit.addEventListener("click", async () => {
  try {
    getCustomersByCitySubmit.disabled = true;

    const city = document.getElementById(
      "form-get-customers-bycity-city"
    ).value;

    await fetchFormatAndOutput(`customers/by_city/${city.toLowerCase()}`);

    getCustomersByCitySubmit.disabled = false;
  } catch (error) {
    console.log(error);
  }
});

const getCustomersByNameSubmit = document.getElementById(
  "form-get-customers-byname-submit"
);
getCustomersByNameSubmit.addEventListener("click", async () => {
  try {
    getCustomersByNameSubmit.disabled = true;

    const name = document.getElementById(
      "form-get-customers-byname-name"
    ).value;

    await fetchFormatAndOutput(`customers/by_name/${name.toLowerCase()}`);

    getCustomersByNameSubmit.disabled = false;
  } catch (error) {
    console.log(error);
  }
});

const putSubmit = document.getElementById("form-put-submit");
putSubmit.addEventListener("click", async () => {
  try {
    putSubmit.disabled = true;

    const customerId = document.getElementById("form-put-customerid").value;
    const email = document.getElementById("form-put-email").value;
    const phone = document.getElementById("form-put-phone").value;

    await fetchFormatAndOutput(`customers/${customerId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        phone: phone,
      }),
    });

    putSubmit.disabled = false;
  } catch (error) {
    console.log(error);
  }
});

const deleteSubmit = document.getElementById("form-delete-submit");
deleteSubmit.addEventListener("click", async () => {
  try {
    deleteSubmit.disabled = true;

    const customerId = document.getElementById("form-delete-customerid").value;

    await fetchFormatAndOutput(`customers/${customerId}`, {
      method: "DELETE",
    });

    deleteSubmit.disabled = false;
  } catch (error) {
    console.log(error);
  }
});
