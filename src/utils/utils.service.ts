import { inject, injectable } from "inversify";

@injectable()
export class UtilService {
  public stringToDateConverter(dateStr: string): Date | never{
    try{
      const dateObj = new Date(dateStr);
      return dateObj;
    }catch(err: any){
      throw new Error(err)
    }
  }

  public sanitizeName(name: string){
    try {
      return name.replace(/\*/g, "").trim();
    } catch (err: any) {
      throw new Error(err)      
    }
  }
}