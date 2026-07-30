import { prisma } from "@/lib/db";
import { createItemHandlers } from "@/lib/api-helpers";

export const { DELETE } = createItemHandlers(prisma.foto);
