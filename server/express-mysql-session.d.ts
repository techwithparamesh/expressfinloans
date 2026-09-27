declare module "express-mysql-session" {
  import type session from "express-session";
  function MySQLStoreFactory(sessionModule: typeof session): new (options: Record<string, unknown>, connection?: unknown) => session.Store;
  export = MySQLStoreFactory;
}
