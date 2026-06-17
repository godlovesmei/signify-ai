import createMiddleware from "next-intl/middleware";

import { routing } from "./routing";

export const handleI18nRouting = createMiddleware(routing);
