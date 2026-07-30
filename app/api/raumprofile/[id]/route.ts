import { prisma } from "@/lib/db";
import { createItemHandlers } from "@/lib/api-helpers";

export const { PATCH, DELETE } = createItemHandlers(prisma.raumProfil);
