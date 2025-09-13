import { Types } from "mongoose";
import { IProcCptDoc } from "../procCpt/procCpt.interface";

export enum CongAnomDiag {
  ArnoldChiari = "arnold chiari malformation",
  Encephaloceles = "encephaloceles",
  Lipomeningocele = "lipomeningocele",
  Meningoceles = "meningoceles",
  MultilocularHydrocephalus = "multilocular hydrocephalus",
  Myelomeningoceles = "myelomeningoceles",
  CraniofacialMalformations = "craniofacial malformations",
  DandyWalker = "dandywalker malformation",
  CommunicatingHydrocephalus = "communicating hydrocephalus- post Hemorrhagic, post infectous",
  NonCommunicatingAqueductal = "noncommunicating hydrocephalus- aqueductal stenosis",
  NonCommunicatingOther = "non communicating hydrocephalus- otherwise",
  TetheredCord = "tethered cord",
  ArachnoidCyst = "arachnoidcyst",
}

export interface IMainDiag {
  title: string;
  procs: Types.ObjectId[];
  diagnosis: Types.ObjectId[];
}

export interface IMainDiagDoc extends IMainDiag {
  _id: Types.ObjectId
}