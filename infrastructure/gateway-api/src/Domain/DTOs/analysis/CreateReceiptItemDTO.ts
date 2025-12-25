import { IsInt, IsNumber, IsString, Min } from "class-validator";

export class CreateReceiptItemDTO {
  @IsInt()
  parfemId!: number;

  @IsString()
  nazivParfema!: string;

  @IsInt()
  @Min(1)
  kolicina!: number;

  @IsNumber()
  @Min(0)
  jedinicnaCena!: number;
}
