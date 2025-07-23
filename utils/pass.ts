import * as cryptoJS from "crypto-js";
import dotenv from "dotenv";

dotenv.config();

const SECRET_KEY = process.env.CRYPTOJS_SECRET_KEY as string;

if (!SECRET_KEY) {
  throw new Error(
    "CRYPTOJS_SECRET_KEY is not defined in environment variables."
  );
}

export const decryptPass = (pass: string): string => {
  return cryptoJS.AES.decrypt(pass, SECRET_KEY).toString(cryptoJS.enc.Utf8);
};

export const encryptPass = (pass: string): string => {
  return cryptoJS.AES.encrypt(pass, SECRET_KEY).toString();
};
