import { IsString } from "class-validator";

export class RunSimulationDTO {
  @IsString()
  algorithmName!: string;
}
