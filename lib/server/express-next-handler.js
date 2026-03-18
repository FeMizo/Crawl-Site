import expressApp from "../../src/server";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
    responseLimit: false,
  },
};

export default function expressNextHandler(req, res) {
  return expressApp(req, res);
}
