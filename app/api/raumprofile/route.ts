import { prisma } from "@/lib/db";
import { createCollectionHandlers } from "@/lib/api-helpers";

export const { POST } = createCollectionHandlers(prisma.raumProfil);
