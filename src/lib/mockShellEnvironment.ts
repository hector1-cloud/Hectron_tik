export interface MockShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timeMs: number;
  newCwd?: string;
  shouldClear?: boolean;
}

export function executeMockBashCommand(
  rawCommand: string,
  currentCwd: string = "/app"
): MockShellResult {
  const startTime = performance.now();
  const trimmed = rawCommand.trim();

  if (!trimmed) {
    return {
      stdout: "",
      stderr: "",
      exitCode: 0,
      timeMs: 1,
      newCwd: currentCwd,
    };
  }

  // Check for clear
  if (trimmed === "clear" || trimmed === "cls") {
    return {
      stdout: "",
      stderr: "",
      exitCode: 0,
      timeMs: 1,
      shouldClear: true,
      newCwd: currentCwd,
    };
  }

  // Handle cd
  if (trimmed.startsWith("cd")) {
    const parts = trimmed.split(/\s+/);
    const target = parts[1] || "~";
    let newPath = currentCwd;

    if (target === "~" || target === "") {
      newPath = "/home/hectron";
    } else if (target === "/") {
      newPath = "/";
    } else if (target === "..") {
      const segs = currentCwd.split("/").filter(Boolean);
      segs.pop();
      newPath = "/" + segs.join("/");
      if (newPath === "") newPath = "/";
    } else if (target.startsWith("/")) {
      newPath = target;
    } else {
      newPath = currentCwd === "/" ? `/${target}` : `${currentCwd}/${target}`;
    }

    return {
      stdout: "",
      stderr: "",
      exitCode: 0,
      timeMs: Math.round(performance.now() - startTime),
      newCwd: newPath,
    };
  }

  // Handle pwd
  if (trimmed === "pwd") {
    return {
      stdout: currentCwd,
      stderr: "",
      exitCode: 0,
      timeMs: 2,
      newCwd: currentCwd,
    };
  }

  // Handle echo
  if (trimmed.startsWith("echo ")) {
    let text = trimmed.substring(5);
    text = text
      .replace(/\$USER/g, "hectron")
      .replace(/\$HOME/g, "/home/hectron")
      .replace(/\$SHELL/g, "/bin/bash")
      .replace(/\$PWD/g, currentCwd)
      .replace(/["']/g, "");
    return {
      stdout: text,
      stderr: "",
      exitCode: 0,
      timeMs: 2,
      newCwd: currentCwd,
    };
  }

  // Handle whoami
  if (trimmed === "whoami") {
    return {
      stdout: trimmed.includes("sudo") ? "root" : "hectron",
      stderr: "",
      exitCode: 0,
      timeMs: 2,
    };
  }

  // Handle id
  if (trimmed === "id") {
    return {
      stdout: "uid=1000(hectron) gid=1000(hectron) groups=1000(hectron),27(sudo),44(video),46(audio),101(streamer)",
      stderr: "",
      exitCode: 0,
      timeMs: 3,
    };
  }

  // Handle uname
  if (trimmed.startsWith("uname")) {
    if (trimmed.includes("-r")) {
      return { stdout: "6.6.0-hectron-streamer-generic", stderr: "", exitCode: 0, timeMs: 3 };
    }
    return {
      stdout: "Linux hectron-streamer-host 6.6.0-hectron-generic #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux",
      stderr: "",
      exitCode: 0,
      timeMs: 4,
    };
  }

  // Handle sudo / systemctl
  if (trimmed.startsWith("sudo systemctl") || trimmed.startsWith("systemctl") || trimmed.startsWith("sudo service")) {
    const isStatus = trimmed.includes("status");
    const isRestart = trimmed.includes("restart") || trimmed.includes("reload");
    const isStart = trimmed.includes("start");
    const isStop = trimmed.includes("stop");

    let serviceName = "hectron-core.service";
    if (trimmed.includes("obs")) serviceName = "obs-websocket.service";
    else if (trimmed.includes("tiktok")) serviceName = "tiktok-webcast.service";
    else if (trimmed.includes("nginx")) serviceName = "nginx.service";
    else if (trimmed.includes("docker")) serviceName = "docker.service";
    else if (trimmed.includes("streamerbot")) serviceName = "streamer-bot.service";

    if (isRestart || isStart) {
      return {
        stdout: `● ${serviceName} iniciado con éxito.\n[OK] Unidad recargada y descriptores de sockets activos.\n[OK] Daemon respondiendo en puerto configurado.`,
        stderr: "",
        exitCode: 0,
        timeMs: 28,
      };
    }
    if (isStop) {
      return {
        stdout: `● ${serviceName} detenido de forma segura (SIGTERM completado).`,
        stderr: "",
        exitCode: 0,
        timeMs: 15,
      };
    }

    // Default status
    return {
      stdout: `● ${serviceName} - Hectron Streamer Linux Service
     Loaded: loaded (/etc/systemd/system/${serviceName}; enabled; preset: enabled)
     Active: active (running) since Fri 2026-08-28 15:40:00 UTC; 4h 22min ago
   Main PID: 455 (node)
      Tasks: 18 (limit: 4915)
     Memory: 142.8M (limit: 4.0G)
        CPU: 1.842s
     CGroup: /system.slice/${serviceName}
             ├─455 node dist/server.cjs
             ├─466 streamer-core-miku
             └─512 autonomy-scheduler

Aug 28 15:40:01 hectron-host systemd[1]: Started ${serviceName} - Hectron Streamer Linux Service.
Aug 28 15:40:02 hectron-host node[455]: [INFO] WebSocket Gateway listening on port 3000
Aug 28 15:40:03 hectron-host node[455]: [INFO] OBS Agent & TikTok Webcast pipeline online`,
      stderr: "",
      exitCode: 0,
      timeMs: 12,
    };
  }

  // Handle sudo apt / apt-get
  if (trimmed.startsWith("sudo apt") || trimmed.startsWith("apt") || trimmed.startsWith("apt-get")) {
    if (trimmed.includes("update")) {
      return {
        stdout: `Hit:1 http://deb.debian.org/debian bookworm InRelease
Hit:2 http://deb.debian.org/debian-security bookworm-security InRelease
Hit:3 http://deb.debian.org/debian bookworm-updates InRelease
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
All packages are up to date. (Mock Sandbox)`,
        stderr: "",
        exitCode: 0,
        timeMs: 35,
      };
    }
    if (trimmed.includes("install")) {
      const pkg = trimmed.split(/\s+/).pop() || "package";
      return {
        stdout: `Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following NEW packages will be installed:
  ${pkg}
0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.
Need to get 4,218 kB of archives.
After this operation, 14.8 MB of additional disk space will be used.
Setting up ${pkg} (1.4.2-1+b1) ...
Processing triggers for man-db (2.11.2-2) ...
[OK] ${pkg} instalado con éxito en el entorno Hectron Linux.`,
        stderr: "",
        exitCode: 0,
        timeMs: 45,
      };
    }
    return {
      stdout: `apt 2.6.1 (x86_64) - Gestor de paquetes Debian para Hectron Linux Container.\nComandos disponibles: update, install, upgrade, remove, list --installed`,
      stderr: "",
      exitCode: 0,
      timeMs: 8,
    };
  }

  // Handle df -h
  if (trimmed.startsWith("df")) {
    return {
      stdout: `Filesystem      Size  Used Avail Use% Mounted on
overlay          32G  6.4G   26G  20% /
tmpfs            64M     0   64M   0% /dev
tmpfs           2.0G     0  2.0G   0% /sys/fs/cgroup
/dev/root        32G  6.4G   26G  20% /app
/dev/nvme0n1p1  512M  6.1M  506M   2% /boot/efi
shm              64M     0   64M   0% /dev/shm`,
      stderr: "",
      exitCode: 0,
      timeMs: 6,
    };
  }

  // Handle free
  if (trimmed.startsWith("free")) {
    return {
      stdout: `               total        used        free      shared  buff/cache   available
Mem:         4096Mi       1420Mi      1820Mi        12Mi       856Mi      2676Mi
Swap:        2048Mi            0      2048Mi`,
      stderr: "",
      exitCode: 0,
      timeMs: 5,
    };
  }

  // Handle uptime
  if (trimmed === "uptime") {
    return {
      stdout: ` 15:42:39 up 3 days, 14:22,  2 users,  load average: 0.28, 0.35, 0.40`,
      stderr: "",
      exitCode: 0,
      timeMs: 3,
    };
  }

  // Handle top / htop
  if (trimmed.startsWith("top") || trimmed.startsWith("htop")) {
    return {
      stdout: `top - 15:42:39 up 3 days, 14:22,  2 users,  load average: 0.28, 0.35, 0.40
Tasks:  18 total,   1 running,  17 sleeping,   0 stopped,   0 zombie
%Cpu(s):  3.2 us,  1.1 sy,  0.0 ni, 95.7 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   4096.0 total,   1820.5 free,   1420.2 used,    855.3 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   2675.8 avail Mem 

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    455 hectron   20   0  982540 142800  34200 S   2.4   3.5   0:14.28 node dist/server.cjs
    466 hectron   20   0  421000  84200  28100 S   1.8   2.1   0:08.92 streamer-core-miku
    512 hectron   20   0  182000  32100  14500 S   0.6   0.8   0:02.15 autonomy-sched
      1 root      20   0   22400   3200   2800 S   0.0   0.1   0:01.02 start.sh
      5 root      20   0   45100   6200   4800 S   0.0   0.2   0:00.34 nginx: master`,
      stderr: "",
      exitCode: 0,
      timeMs: 14,
    };
  }

  // Handle ps
  if (trimmed.startsWith("ps")) {
    return {
      stdout: `  PID TTY          TIME CMD
    1 ?        00:00:01 start.sh
    5 ?        00:00:00 nginx
  455 ?        00:00:14 node (server.ts)
  466 ?        00:00:08 streamer-core-miku
  512 ?        00:00:02 autonomy-scheduler
  620 pts/0    00:00:00 bash (mock-shell)`,
      stderr: "",
      exitCode: 0,
      timeMs: 6,
    };
  }

  // Handle cat
  if (trimmed.startsWith("cat ")) {
    const target = trimmed.substring(4).trim();
    if (target.includes("os-release")) {
      return {
        stdout: `PRETTY_NAME="Debian GNU/Linux 12 (bookworm) / Hectron OCI Container"
NAME="Debian GNU/Linux"
VERSION_ID="12"
VERSION="12 (bookworm)"
VERSION_CODENAME=bookworm
ID=debian
HOME_URL="https://www.debian.org/"
SUPPORT_URL="https://hectron.io/support"`,
        stderr: "",
        exitCode: 0,
        timeMs: 4,
      };
    }
    if (target.includes("hosts")) {
      return {
        stdout: `127.0.0.1   localhost localhost.localdomain hectron-streamer-host\n::1         localhost ip6-localhost ip6-loopback`,
        stderr: "",
        exitCode: 0,
        timeMs: 3,
      };
    }
    if (target.includes("package.json")) {
      return {
        stdout: `{\n  "name": "hectron-streamers-universe",\n  "version": "2.5.0",\n  "type": "module",\n  "description": "Autonomous VTuber & Multi-Platform Streaming Engine"\n}`,
        stderr: "",
        exitCode: 0,
        timeMs: 5,
      };
    }
    return {
      stdout: `[Contenido de archivo simulado: ${target}]\n// Archivo accesible en el entorno de ejecución Linux de Hectron\n// Permisos: -rw-r--r-- hectron:hectron`,
      stderr: "",
      exitCode: 0,
      timeMs: 8,
    };
  }

  // Handle ls
  if (trimmed.startsWith("ls") || trimmed === "ll" || trimmed === "dir") {
    const isDetailed = trimmed.includes("-l") || trimmed === "ll";
    if (isDetailed) {
      return {
        stdout: `total 48
drwxr-xr-x 8 hectron hectron 4096 Aug 28 15:40 .
drwxr-xr-x 3 root    root    4096 Aug 28 15:38 ..
-rw-r--r-- 1 hectron hectron  542 Aug 28 15:39 .env.example
-rw-r--r-- 1 hectron hectron  280 Aug 28 15:38 metadata.json
-rw-r--r-- 1 hectron hectron 1850 Aug 28 15:39 package.json
drwxr-xr-x 2 hectron hectron 4096 Aug 28 15:39 public
-rw-r--r-- 1 hectron hectron 9200 Aug 28 15:40 README.md
-rw-r--r-- 1 hectron hectron 2574 Aug 28 15:40 server.ts
drwxr-xr-x 5 hectron hectron 4096 Aug 28 15:40 src
-rw-r--r-- 1 hectron hectron  480 Aug 28 15:39 tsconfig.json
-rw-r--r-- 1 hectron hectron  610 Aug 28 15:39 vite.config.ts`,
        stderr: "",
        exitCode: 0,
        timeMs: 6,
      };
    }
    return {
      stdout: `metadata.json  package.json  public  README.md  server.ts  src  tsconfig.json  vite.config.ts`,
      stderr: "",
      exitCode: 0,
      timeMs: 4,
    };
  }

  // Handle node / npm / git / docker
  if (trimmed.startsWith("node")) {
    return { stdout: "v22.14.0", stderr: "", exitCode: 0, timeMs: 4 };
  }
  if (trimmed.startsWith("npm")) {
    return { stdout: "10.9.0", stderr: "", exitCode: 0, timeMs: 6 };
  }
  if (trimmed.startsWith("git")) {
    if (trimmed.includes("status")) {
      return {
        stdout: `On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean`,
        stderr: "",
        exitCode: 0,
        timeMs: 8,
      };
    }
    if (trimmed.includes("branch")) {
      return { stdout: `* main`, stderr: "", exitCode: 0, timeMs: 4 };
    }
    return {
      stdout: `git version 2.43.0\nRama activa: main [clean]`,
      stderr: "",
      exitCode: 0,
      timeMs: 5,
    };
  }
  if (trimmed.startsWith("docker")) {
    return {
      stdout: `CONTAINER ID   IMAGE                  COMMAND                  CREATED         STATUS         PORTS                    NAMES
8f1b4a2c9d01   hectron-streamer:2.5   "node dist/server.cjs"   4 hours ago     Up 4 hours     0.0.0.0:3000->3000/tcp   hectron_app_container`,
      stderr: "",
      exitCode: 0,
      timeMs: 12,
    };
  }

  // Handle network commands: ping, curl, ifconfig, ip, netstat
  if (trimmed.startsWith("ping")) {
    const target = trimmed.split(/\s+/).pop() || "127.0.0.1";
    return {
      stdout: `PING ${target} (${target}) 56(84) bytes of data.
64 bytes from ${target}: icmp_seq=1 ttl=64 time=0.042 ms
64 bytes from ${target}: icmp_seq=2 ttl=64 time=0.038 ms
64 bytes from ${target}: icmp_seq=3 ttl=64 time=0.041 ms
64 bytes from ${target}: icmp_seq=4 ttl=64 time=0.039 ms

--- ${target} ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms
rtt min/avg/max/mdev = 0.038/0.040/0.042/0.002 ms`,
      stderr: "",
      exitCode: 0,
      timeMs: 25,
    };
  }

  if (trimmed.startsWith("curl")) {
    return {
      stdout: `HTTP/1.1 200 OK\nContent-Type: application/json\nDate: ${new Date().toUTCString()}\nServer: Hectron-Linux-Gateway\n\n{\n  "status": "healthy",\n  "service": "Hectron Core",\n  "activeStreamers": 1\n}`,
      stderr: "",
      exitCode: 0,
      timeMs: 20,
    };
  }

  if (trimmed.startsWith("ifconfig") || trimmed.startsWith("ip")) {
    return {
      stdout: `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.17.0.2  netmask 255.255.0.0  broadcast 172.17.255.255
        inet6 fe80::42:acff:fe11:2  prefixlen 64  scopeid 0x20<link>
        ether 02:42:ac:11:00:02  txqueuelen 0  (Ethernet)
        RX packets 24158  bytes 1845200 (1.8 MB)
        TX packets 21040  bytes 1624800 (1.6 MB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)`,
      stderr: "",
      exitCode: 0,
      timeMs: 8,
    };
  }

  if (trimmed.startsWith("netstat")) {
    return {
      stdout: `Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 0.0.0.0:3000            0.0.0.0:*               LISTEN      455/node            
tcp        0      0 127.0.0.1:8787          0.0.0.0:*               LISTEN      466/streamer-agent  
tcp        0      0 127.0.0.1:4455          0.0.0.0:*               LISTEN      470/obs-websocket   
tcp        0      0 127.0.0.1:8080          0.0.0.0:*               LISTEN      480/streamer-bot    
tcp6       0      0 :::80                   :::*                    LISTEN      5/nginx: master`,
      stderr: "",
      exitCode: 0,
      timeMs: 10,
    };
  }

  // Handle help
  if (trimmed === "help" || trimmed === "--help" || trimmed === "-h") {
    return {
      stdout: `========================================================================
SHELL LINUX HECTRON STREAMERS - GUÍA DE COMANDOS INTERACTIVOS (BASH)
========================================================================

[SISTEMA Y HARDWARE]
  uname -a              Información del kernel Linux y arquitectura
  uptime                Tiempo de actividad y carga promedio del sistema
  free -m / free -h     Memoria RAM libre, utilizada y swap
  df -h                 Espacio en disco y particiones montadas
  cat /etc/os-release   Distribución del sistema operativo (Debian 12)
  whoami / id           Usuario actual y privilegios de grupo

[GESTIÓN DE SERVICIOS Y ROOT (SIMULACIÓN SEGURA)]
  sudo systemctl status obs      Estado del servicio OBS WebSocket
  sudo systemctl status tiktok   Estado del conector TikTok Webcast
  sudo systemctl restart nginx   Reiniciar el proxy de red
  sudo apt update               Actualizar repositorios de paquetes
  sudo apt install ffmpeg       Instalar herramientas multimedia

[PROCESOS Y MONITOREO]
  ps aux / top / htop   Lista de procesos activos con uso de CPU y RAM
  kill <PID>            Terminar un proceso en ejecución

[RED Y CONECTIVIDAD]
  ip a / ifconfig       Configuración de interfaces de red (eth0, lo)
  netstat -tuln         Puertos en escucha (3000, 4455, 8787, 8080)
  ping <host>           Probar latencia ICMP
  curl -I <url>         Consultar cabeceras HTTP

[ARCHIVOS Y NAVEGACIÓN]
  ls -la / ll           Listar archivos con permisos y tamaños
  cd <directorio>       Cambiar de directorio de trabajo
  pwd                   Mostrar ruta actual
  cat <archivo>         Visualizar contenido de archivos
  clear / cls           Limpiar la pantalla de la terminal
========================================================================`,
      stderr: "",
      exitCode: 0,
      timeMs: 4,
    };
  }

  // Default fallback for unrecognized bash command (graceful simulated execution)
  return {
    stdout: `[bash] Comando ejecutado con éxito: "${trimmed}"\nResultado: Ejecución POSIX completada en entorno Linux simulado (0 errores).`,
    stderr: "",
    exitCode: 0,
    timeMs: Math.max(5, Math.round(performance.now() - startTime)),
    newCwd: currentCwd,
  };
}
