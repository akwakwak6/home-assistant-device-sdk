import { IAllSateDtoIn, IAttributeDtoInBase } from "../dto/in/base.dto.in";
import { IConfigDal } from "./configDal.type";

export interface IBuilderHaOption {
    url?: string;
    token?: string;
    configDal?: IConfigDal;
    out?: string;
    configPath?: string;
}

export interface IDeviceToBuild<T extends IAttributeDtoInBase = IAllSateDtoIn> {
    attributes: T;
    name: string;
    id: string;
    type: string;
}
