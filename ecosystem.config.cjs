module.exports = {
  apps: [
    {
      name: "witch-web",
      script: "npm",
      args: "run dev",
      cwd: "/home/witch/htdocs/witch.pw",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: "3003",
      },
    },
    {
      name: "witch-worker",
      script: "npm",
      args: "run worker:all",
      cwd: "/home/witch/htdocs/witch.pw",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
