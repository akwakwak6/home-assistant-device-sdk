import { IStateDtoIn } from "src/types/dto/in/base.dto.in";
import { STATES_MOCK } from "src/mocks/state.dto.in.mock";

export async function getStatesMock(): Promise<IStateDtoIn[]> {
    return Promise.resolve(STATES_MOCK);
}
