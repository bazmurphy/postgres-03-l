// for using environment variables
require("dotenv").config();
const express = require("express");
// import helper functions for validation
const { validatePhoneNumber, validateEmail } = require("./validators");
// express now has this functionality built in:
// const bodyParser = require("body-parser")

const app = express();
app.use(express.static("public"));
// app.use(bodyparser.json());
// replaced with:
app.use(express.json());
// this parses the incoming request body if it is in URL-encoded format, such as form data (!)
app.use(express.urlencoded({ extended: true }));

const { Pool } = require("pg");

const db = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

app.get("/customers", async (req, res) => {
  try {
    const queryResult = await db.query(
      `SELECT id, name, city, phone FROM customers ORDER BY id ASC`
    );
    res.status(200).json({ success: true, data: queryResult.rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error });
  }
});

app.get("/customers/:id", async (req, res) => {
  try {
    // we need to convert this to an int first (in a way helps to prevent SQL Injection)
    const customerId = parseInt(req.params.id);
    // The value we are wanting to look for appears as $1 - this is a placeholder for the 'id' value
    // In db.query you can use placeholders $1, $2, ... $9, $10, $11, ... etc to mark the place where a parameter value should be used. The parameters to replace the placeholders are supplied in the second argument, the array of values. In this case there is only one value (but it must still be put into an array) so we have [custId] as the replacement value for the first placeholder, $1. If there is more than one placeholder there must be the same number of array elements and they must be in the order of the placeholder numbers.
    const queryResult = await db.query(
      `SELECT * FROM customers WHERE id = $1`,
      [customerId]
    );
    res.status(200).json({ success: true, data: queryResult.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

app.get("/customers/by_city/:city", async (req, res) => {
  try {
    const cityName = req.params.city.toLowerCase();

    const queryResult = await db.query(
      // the || '%' adds a % to the end of the string
      // cityName%
      `SELECT * FROM customers WHERE LOWER(city) LIKE $1 || '%'`,
      [cityName]
    );
    res.status(200).json({ success: true, data: queryResult.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

app.get("/customers/by_name/:name", async (req, res) => {
  try {
    const customerName = req.params.name.toLowerCase();

    const queryResult = await db.query(
      // we add the LOWER() functions
      // %customerName%
      `SELECT * FROM customers WHERE LOWER(name) LIKE LOWER('%' || $1 || '%')`,
      [customerName]
    );
    res.status(200).json({ success: true, data: queryResult.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

app.post("/customers", async (req, res) => {
  try {
    const {
      name: newName,
      email: newEmail,
      phone: newPhone,
      address: newAddress,
      city: newCity,
      postcode: newPostcode,
      country: newCountry,
    } = req.body;

    if (!validatePhoneNumber(newPhone)) {
      return res.status(400).json({
        success: false,
        error: `The phone number ${newPhone} is an invalid format`,
      });
    }

    if (!validateEmail(newEmail)) {
      return res.status(400).json({
        success: false,
        error: `The email ${newEmail} is an invalid format`,
      });
    }

    const queryEmail = await db.query(
      `SELECT 1 FROM customers WHERE email = $1`,
      [newEmail]
    );
    // console.log("queryEmail:", queryEmail);

    if (queryEmail.rowCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Customer with email ${newEmail} already exists`,
      });
    }

    const queryInsert = await db.query(
      `INSERT INTO customers (name, email, phone, address, city, postcode, country) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING id`,
      [
        newName,
        newEmail,
        newPhone,
        newAddress,
        newCity,
        newPostcode,
        newCountry,
      ]
    );
    // console.log("queryInsert:", queryInsert);

    const newId = queryInsert.rows[0].id;
    // console.log("newId:", newId);

    res
      .status(200)
      .json({ success: true, message: `Customer id ${newId} created` });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

app.put("/customers/:id", async (req, res) => {
  const customerId = req.params.id;
  const { email: newEmail, phone: newPhone } = req.body;

  if (!validatePhoneNumber(newPhone)) {
    return res.status(400).json({
      success: false,
      error: `The phone number ${newPhone} is an invalid format`,
    });
  }

  if (!validateEmail(newEmail)) {
    return res.status(400).json({
      success: false,
      error: `The email ${newEmail} is an invalid format`,
    });
  }

  const queryCustomerId = await db.query(
    `SELECT 1 FROM customers WHERE id = $1`,
    [customerId]
  );
  // console.log("queryCustomerId:", queryCustomerId);

  if (queryCustomerId.rowCount === 0) {
    return res.status(400).json({
      success: false,
      error: `Customer id:${customerId} does not exist`,
    });
  }

  const queryUpdate = await db.query(
    `UPDATE customers SET email = $2, phone = $3 WHERE id = $1 RETURNING id`,
    [customerId, newEmail, newPhone]
  );
  // console.log("queryUpdate:", queryUpdate);

  const updatedId = queryUpdate.rows[0].id;
  // console.log("updatedId:", updatedId);

  return res
    .status(200)
    .json({ success: true, message: `Customer id:${updatedId} updated` });
});

app.put("/reservations/:id", async (req, res) => {
  try {
    const reservationId = req.params.id;
    const roomNumber = req.body.roomnumber;

    const queryReservationId = await db.query(
      `SELECT 1 FROM reservations WHERE id = $1`,
      [reservationId]
    );
    // console.log("queryReservationId:", queryReservationId);

    if (queryReservationId.rowCount === 0) {
      return res.status(400).json({
        success: false,
        error: `Reservation id:${reservationId} does not exist`,
      });
    }

    const queryUpdate = await db.query(
      `UPDATE reservations SET room_no = $2 WHERE id = $1 RETURNING id`,
      [reservationId, roomNumber]
    );
    // console.log("queryUpdate:", queryUpdate);

    const updatedId = queryUpdate.rows[0].id;
    // console.log("updatedId:", updatedId);

    return res.status(200).json({
      success: true,
      message: `Reservation id:${updatedId} updated. Room ${roomNumber} allocated`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

app.delete("/customers/:id", async (req, res) => {
  // If you try to delete a customer which already has some bookings, the previous endpoint will fail.

  // db.query(`DELETE FROM customers WHERE id=$1`, [customerId])
  //   .then(() => res.send(`Customer ${customerId} deleted`))
  //   .catch((error) => console.log(error));
  // error: update or delete on table "customers" violates foreign key constraint "res_guest_fk" on table "reservations"

  // You cannot delete a customer whose ID is used as a foreign key in another table (in this case, in the reservations table).
  // So we need to delete all the customer bookings first

  // db.query(`DELETE FROM reservations WHERE cust_id = $1`, [customerId])
  //   .then(() => {
  //     return db.query(`DELETE FROM customers WHERE id = $1`, [customerId]);
  //   })
  //   .then(() => res.send(`Customer ${customerId} deleted!`))
  //   .catch((error) => console.log(error));

  try {
    const customerId = req.params.id;

    const queryCustomerId = await db.query(
      `SELECT 1 FROM customers WHERE id = $1`,
      [customerId]
    );
    // console.log("queryCustomerId:", queryCustomerId);

    if (queryCustomerId.rowCount === 0) {
      return res.status(400).json({
        success: false,
        error: `Customer id:${customerId} does not exist`,
      });
    }

    await db.query(`DELETE FROM reservations WHERE cust_id = $1`, [customerId]);
    await db.query(`DELETE FROM customers WHERE id = $1`, [customerId]);

    res
      .status(200)
      .json({ success: true, message: `Customer ${customerId} deleted!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

app.delete("/reservations/:id", async (req, res) => {
  try {
    const reservationId = req.params.id;

    const queryReservationId = await db.query(
      `SELECT 1 FROM reservations WHERE id = $1`,
      [reservationId]
    );
    // console.log("queryCustomerId:", queryCustomerId);

    if (queryReservationId.rowCount === 0) {
      return res.status(400).json({
        success: false,
        error: `Reservation id:${reservationId} does not exist`,
      });
    }

    await db.query(`DELETE FROM invoices WHERE res_id = $1`, [reservationId]);
    await db.query(`DELETE FROM reservations WHERE id = $1`, [reservationId]);

    res.status(200).json({
      success: true,
      message: `Reservation id:${reservationId} deleted`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "./public/index.html");
});

app.listen(3000, () => {
  console.log("The server is running on port 3000");
});
