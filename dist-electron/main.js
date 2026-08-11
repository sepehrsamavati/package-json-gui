import { BrowserWindow as e, app as t, ipcMain as n } from "electron";
import r, { dirname as i, join as a } from "node:path";
import { fileURLToPath as o } from "node:url";
import { asFunction as s, createContainer as c } from "awilix";
import l from "node:fs";
import u from "node:os";
//#endregion
//#region electron/infra/database.ts
var d = (/* @__PURE__ */ ((e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports))(((e, t) => {
	t.exports = {};
})))(), f = () => {
	let e = t.getPath("userData"), n = r.join(e, "projects.db");
	l.mkdirSync(e, { recursive: !0 });
	let i = new d.DatabaseSync(n);
	return i.exec("\n    CREATE TABLE IF NOT EXISTS projects (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      name TEXT NOT NULL,\n      path TEXT NOT NULL,\n      created_at TEXT DEFAULT CURRENT_TIMESTAMP\n    );\n  "), {
		getDb: () => i,
		close: () => {
			i.close();
		}
	};
}, p = ({ database: e }) => ({
	getAll: () => e.getDb().prepare("SELECT id, name, path, created_at as createdAt FROM projects ORDER BY id DESC").all(),
	create: (t, n) => {
		let r = e.getDb(), i = r.prepare("INSERT INTO projects (name, path) VALUES (?, ?)").run(t, n).lastInsertRowid;
		return r.prepare("SELECT id, name, path, created_at as createdAt FROM projects WHERE id = ?").get(i);
	}
}), m = () => ({ getOsInfo: () => ({
	platform: u.platform(),
	release: u.release(),
	arch: u.arch(),
	uptime: u.uptime()
}) }), h = () => {
	let e = c();
	return e.register({
		database: s(f).singleton(),
		projectService: s(p).singleton(),
		osService: s(m).singleton()
	}), e;
}, g = (e) => {
	let t = e.resolve("osService"), r = e.resolve("projectService");
	n.handle("getOsInfo", async () => t.getOsInfo()), n.handle("getProjects", async () => r.getAll()), n.handle("createProject", async (e, t, n) => r.create(t, n));
}, _ = o(import.meta.url), v = i(_), y = null, b = null, x = () => {
	y = new e({
		title: "package-json-gui",
		width: 1024,
		height: 768,
		webPreferences: {
			preload: a(v, "preload.mjs"),
			contextIsolation: !0,
			nodeIntegration: !1
		}
	});
	let t = process.env.VITE_DEV_SERVER_URL;
	t ? (y.loadURL(t), y.webContents.openDevTools()) : y.loadFile(a(v, "../dist/index.html")), y.on("closed", () => {
		y = null;
	});
};
t.whenReady().then(() => {
	b = h(), g(b), x(), t.on("activate", () => {
		e.getAllWindows().length === 0 && x();
	});
}), t.on("window-all-closed", () => {
	b && b.resolve("database").close(), process.platform !== "darwin" && t.quit();
});
//#endregion
