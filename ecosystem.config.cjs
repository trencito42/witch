module.exports = {
  apps: [
    {
      name: "witch-web",
      script: "npm",
      args: "start",
      cwd: "/home/witch/htdocs/witch.pw",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
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
