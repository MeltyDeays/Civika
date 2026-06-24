import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";

const mvnBin = path.join(root, "tools", "apache-maven-3.9.6", "bin", isWin ? "mvn.cmd" : "mvn");
const pom = path.join(root, "backend", "biometric-service", "pom.xml");
const cudaDepsBin = path.join(root, "tools", "cuda-deps", "bin");

const jdkCandidates = [
  process.env.JAVA_HOME,
  "C:\\Program Files\\Microsoft\\jdk-17.0.19.10-hotspot",
  "C:\\Program Files\\Java\\jdk-17",
].filter(Boolean);

const javaHome = jdkCandidates.find((candidate) => fs.existsSync(candidate));

if (!fs.existsSync(mvnBin)) {
  console.error(
    "Maven no encontrado en tools/apache-maven-3.9.6. Reinstala Maven en esa carpeta."
  );
  process.exit(1);
}

if (!javaHome) {
  console.error(
    "JDK 17 no encontrado. Instala Microsoft OpenJDK 17 o define JAVA_HOME."
  );
  process.exit(1);
}

if (!fs.existsSync(cudaDepsBin) || fs.readdirSync(cudaDepsBin).length === 0) {
  console.warn(
    "CUDA/cuDNN no instalados. Ejecuta: backend/biometric-service/scripts/install-cuda-deps.ps1"
  );
} else {
  console.log(`CUDA/cuDNN: tools/cuda-deps/bin (${fs.readdirSync(cudaDepsBin).length} DLLs)`);
}

const pathSep = isWin ? ";" : ":";
const pathPrefix = [
  fs.existsSync(cudaDepsBin) ? cudaDepsBin : null,
  path.join(javaHome, "bin"),
  path.dirname(mvnBin),
]
  .filter(Boolean)
  .join(pathSep);

const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  PATH: `${pathPrefix}${pathSep}${process.env.PATH || ""}`,
};

const child = spawn(mvnBin, ["-f", pom, "spring-boot:run"], {
  stdio: "inherit",
  env,
  cwd: root,
  shell: isWin,
});

child.on("exit", (code) => process.exit(code ?? 1));
