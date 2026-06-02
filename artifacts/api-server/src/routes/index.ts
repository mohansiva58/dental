import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import patientsRouter from "./patients";
import opRecordsRouter from "./op-records";
import clinicalRouter from "./clinical";
import invoicesRouter from "./invoices";
import followupsRouter from "./followups";
import dashboardRouter from "./dashboard";
import notificationsRouter from "./notifications";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(patientsRouter);
router.use(opRecordsRouter);
router.use(clinicalRouter);
router.use(invoicesRouter);
router.use(followupsRouter);
router.use(dashboardRouter);
router.use(notificationsRouter);
router.use(reportsRouter);

export default router;
