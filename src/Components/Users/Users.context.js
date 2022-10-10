import { bind } from "@react-rxjs/core";
import { MondayService } from "../../Services/Monday.service";

export const [useAllTeams, AllTeams$] = bind(
    MondayService.AllTeams$, []
)