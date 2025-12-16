import { IsInt, Min } from "class-validator";

export class SendRequestDTO {
  @IsInt()
  @Min(1)
  count!: number;
}
