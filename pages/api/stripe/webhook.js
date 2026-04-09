// Stripe webhook requires raw body — bodyParser must be false
// express.raw() in server.js handles this at the route level
export { config, default } from "../../../lib/server/express-next-handler";
