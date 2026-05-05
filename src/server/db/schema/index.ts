import * as auth from "./auth-schema";
import * as retro from "./retro";
import * as todo from "./todos";

export const schema = { ...auth, ...todo, ...retro };
