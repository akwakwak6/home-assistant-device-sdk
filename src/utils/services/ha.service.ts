import { IStateDtoIn } from "src/types/dto/in/base.dto.in";

export async function getStates(url: string, token: string): Promise<IStateDtoIn[]> {
    const response = await fetch(`${url}/api/states`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (response.ok) {
        return response.json();
    }
    throw new Error(`Failed to fetch states: ${response.statusText}`);
}
