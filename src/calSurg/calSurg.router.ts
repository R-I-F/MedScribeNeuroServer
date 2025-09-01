import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";

injectable();
export class CalSurgRouter {
  public router: Router;

  constructor() // inject()
  {
    this.router = express.Router();
    this.initRoutes();
  }

  private async initRoutes() {
    this.router.post(
      "/postAllCalSurgFromExternal",
      async (req: Request, res: Response) => {}
    );
  }
}
