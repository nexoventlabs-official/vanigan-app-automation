const { Client } = require('ssh2');
const path = require('path');

const conn = new Client();

const host = '168.144.180.123';
const port = 22;
const username = 'root';
const password = 'PeriviHari@8A';

const localBase = 'C:\\Users\\Admin\\Desktop\\Prodution\\Vanigan';

const uploads = [
  {
    local: path.join(localBase, 'backend', 'server.js'),
    remote: '/var/www/vanigan/backend/server.js'
  },
  {
    local: path.join(localBase, 'backend', 'services', 'memberDb.js'),
    remote: '/var/www/vanigan/backend/services/memberDb.js'
  },
  {
    local: path.join(localBase, 'backend', 'services', 'memberCard.js'),
    remote: '/var/www/vanigan/backend/services/memberCard.js'
  },
  {
    local: path.join(localBase, 'backend', 'models', 'Posting.js'),
    remote: '/var/www/vanigan/backend/models/Posting.js'
  },
  {
    local: path.join(localBase, 'backend', 'models', 'Wing.js'),
    remote: '/var/www/vanigan/backend/models/Wing.js'
  },
  {
    local: path.join(localBase, 'backend', 'routes', 'memberAuth.js'),
    remote: '/var/www/vanigan/backend/routes/memberAuth.js'
  },
  {
    local: path.join(localBase, 'backend', 'routes', 'organizers.js'),
    remote: '/var/www/vanigan/backend/routes/organizers.js'
  },
  {
    local: path.join(localBase, 'backend', 'routes', 'postings.js'),
    remote: '/var/www/vanigan/backend/routes/postings.js'
  },
  {
    local: path.join(localBase, 'backend', 'routes', 'wings.js'),
    remote: '/var/www/vanigan/backend/routes/wings.js'
  },
  {
    local: path.join(localBase, 'backend', 'routes', 'dashboard.js'),
    remote: '/var/www/vanigan/backend/routes/dashboard.js'
  },
  {
    local: path.join(localBase, 'frontend.tar.gz'),
    remote: '/var/www/vanigan/frontend.tar.gz'
  },
  {
    local: path.join(localBase, 'userwebsite.tar.gz'),
    remote: '/var/www/vanigan/userwebsite.tar.gz'
  }
];

conn.on('ready', () => {
  console.log('SSH connection established.');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    let completed = 0;
    
    function uploadNext() {
      if (completed >= uploads.length) {
        console.log('All files uploaded successfully via SFTP.');
        executeRemoteCommands();
        return;
      }
      
      const item = uploads[completed];
      console.log(`Uploading ${path.basename(item.local)} -> ${item.remote}...`);
      
      sftp.fastPut(item.local, item.remote, (sftpErr) => {
        if (sftpErr) {
          console.error(`SFTP Upload Error for ${item.local}:`, sftpErr);
          conn.end();
          return;
        }
        console.log(`Uploaded ${path.basename(item.local)} successfully.`);
        completed++;
        uploadNext();
      });
    }
    
    uploadNext();
  });
});

function executeRemoteCommands() {
  console.log('Executing extraction and restart commands on server...');
  
  const cmd = [
    // Extract admin panel
    'echo "Deploying frontend_admin..."',
    'rm -rf /var/www/vanigan/frontend_admin/*',
    'tar -xzf /var/www/vanigan/frontend.tar.gz -C /var/www/vanigan/frontend_admin/',
    'rm /var/www/vanigan/frontend.tar.gz',
    
    // Extract user website
    'echo "Deploying userwebsite..."',
    'rm -rf /var/www/vanigan/userwebsite/*',
    'tar -xzf /var/www/vanigan/userwebsite.tar.gz -C /var/www/vanigan/userwebsite/',
    'rm /var/www/vanigan/userwebsite.tar.gz',
    
    // Restart PM2 backend
    'echo "Restarting backend..."',
    'pm2 restart vanigan-backend',
    'echo "Deployment complete!"'
  ].join(' && ');

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    
    stream.on('close', (code, signal) => {
      console.log(`Remote execution closed (Exit Code: ${code})`);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}

conn.on('error', (err) => {
  console.error('Connection Error:', err);
});

conn.connect({
  host,
  port,
  username,
  password
});
