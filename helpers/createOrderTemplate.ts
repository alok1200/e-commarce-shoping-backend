// src/utils/emailTemplates.ts

// interface Product {
//     title: string;
//     price: number;
//     quantity: number;
//   }

//   interface UserInfo {
//     name: string;
//   }

//   interface Order {
//     products: Product[];
//     userInfo: UserInfo;
//     price: number;
//     orderStatus?: string;
//     _id: string;
//   }

/**
 * Generate an HTML email template for order confirmation/update
 */
export const createOrderTemplate = (order: Order): string => {
  const { products, userInfo, price, orderStatus, _id } = order;
  const RazorpayFeePercent = 0.02; // 2%
  const RazorpayFee = Math.ceil(price * RazorpayFeePercent); // in INR
  const TotalPriceWithRazorpayFee = price + RazorpayFee;

  const productRows = products
    .map((p) => {
      return `
        <tr class='info'>     
          <td>${p.title}</td>
          <td style="text-align: right;"><strong>${
            p.price * p.quantity
          }</strong></td>
        </tr>
      `;
    })
    .join(""); // Join array to a single HTML string

  return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset='UTF-8'>
          <meta name='viewport' content='width=device-width, initial-scale=1.0'>
          <title>Order Status Update</title>
          <style>
              p{ margin: 5px; }
              .center { text-align: center; }
              body {
                  font-family: 'Helvetica Neue', sans-serif;
                  color: #444;
                  font-size: 16px;
                  line-height: 1.5;
                  background-color: #f5f5f5;
                  margin: 0;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #fff;
                  border-radius: 10px;
                  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
                  padding: 20px;
              }
              .wrapper {
                  width: 500px;
                  max-width: 90%;
              }
              h1 {
                  font-size: 28px;
                  margin-bottom: 30px;
                  text-align: center;
                  margin: 0;
              }
              h2 {
                  margin: 0;
                  font-size: 2rem;
                  font-weight: 600;
                  text-align: center;
              }
              p {
                  font-size: 18px;
                  line-height: 1.6;
              }
              .summary {
                  margin: 1rem 0;
                  background-color: #eee;
                  border-radius: 1vmin;
                  padding: 0.5rem 1rem;
              }
              .info {
                  display: flex;
                  justify-content: space-between;
              }
              button {
                  width: 100%;
                  background-color: teal;
                  color: white;
                  padding: 1rem;
                  border: none;
                  border-radius: 1vmin;
                  margin-top: 1rem;
              }
          </style>
      </head>
      <body>
          <div class='container'>
              <div class='wrapper'>
                  <h1>Order Update</h1>
                  <h2>${TotalPriceWithRazorpayFee} Rs.</h2> 
                  <p>Hello ${userInfo.name},</p>
                  <p>Thank you for shopping with Satnam Creation. We have received your order and will get started on it right away.</p>
                  <p>Once your order has been processed and is on its way, we'll send you a shipping confirmation with your expected delivery date.</p>
  
                  <table class='summary'>
                      <tbody>
                          <tr>
                              <td>Order Number:</td>
                              <td style="text-align: right;"><strong>${_id}</strong></td>
                          </tr>
                          <tr>
                              <td>Order Status:</td>
                              <td style="text-align: right;"><strong>${
                                orderStatus || "Pending"
                              }</strong></td>
                          </tr>
                      </tbody>
                  </table>
                  <hr/>
                  <table class='products'>
                      <tbody>
                          ${productRows}
                          <tr class='info'>
                              <td>Transaction fee</td>
                              <td style="text-align: right;"><strong>${RazorpayFee} Rs. (2%)</strong></td>
                          </tr>
                          <tr class='info'>
                              <td>Total</td>
                              <td style="text-align: right;"><strong>${TotalPriceWithRazorpayFee}</strong></td>
                          </tr>
                      </tbody>
                  </table>
                  <button>Check Order</button>
                  <p class='center'>Thank you for shopping with us!</p>
              </div>
          </div>
      </body>
      </html>
    `;
};

/**
 * Generate reset password email HTML
 */
export const createResetEmailHTML = (userName: string, url: string): string => {
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Password Reset</title>
        <style>
          * { margin: 0; }
          .container { color: black; }
          .center { text-align: center; }
          .secondcontainer { margin-left: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="firstcontainer" style="box-shadow: 0 2px 2px -2px rgba(0,0,0,.5)">
            <h1 style="margin: 10px 0px" class="center">Satnam Creation</h1>
            <p style="margin: 10px 0px;" class="center">Reset Password</p>
          </div>
          <div class="secondcontainer">
            <p style="margin-bottom: 10px;">Hi ${userName},</p>
            <p>Forgot your password?</p>
            <p style="margin-bottom: 10px;">We received a request to reset your account password.</p>
            <p>To reset your password, click the button below:</p>
            <a href="${url}">
              <button style="margin-bottom: 10px;">Reset Password</button>
            </a>
            <p>Or copy and paste the URL in your browser:</p>
            <a href="${url}">${url}</a>
          </div>
        </div>
      </body>
      </html>
    `;
};
