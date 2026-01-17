const fs = require('fs');
const path = require('path');

const CHUNKS_DIR = path.join(__dirname, '_next', 'static', 'chunks');
const PROXY_URL = 'https://axiom-backend-production.up.railway.app';
const PROXY_WS = 'wss://axiom-backend-production.up.railway.app';

// All axiom.trade subdomains mapped to proxy paths
const ALL_DOMAINS = {
  // Translate
  'translate.axiom.trade': '/translate',
  // Cluster subdomains
  'cluster2.axiom.trade': '/cluster/2',
  'cluster3.axiom.trade': '/cluster/3',
  'cluster4.axiom.trade': '/cluster/4',
  'cluster5.axiom.trade': '/cluster/5',
  'cluster6.axiom.trade': '/cluster/6',
  'cluster7.axiom.trade': '/cluster/7',
  'cluster8.axiom.trade': '/cluster/8',
  'cluster9.axiom.trade': '/cluster/9',
  'cluster-asia2.axiom.trade': '/cluster/asia2',
  'cluster-gcp-asia1.axiom.trade': '/cluster/gcp-asia1',
  'cluster-gcp-aus1.axiom.trade': '/cluster/gcp-aus1',
  // Socket
  'socket8.axiom.trade': '/socket8',
  // Reporting
  'reporting.axiom.trade': '/reporting',
  // Transaction
  'tx-pro.axiom.trade': '/tx-pro',
  'tx-custom.axiom.trade': '/tx-custom',
  // API endpoints
  'api.axiom.trade': '/api',
  'api1.axiom.trade': '/api1',
  'api2.axiom.trade': '/api2',
  'api3.axiom.trade': '/api3',
  'api4.axiom.trade': '/api4',
  'api5.axiom.trade': '/api5',
  'api6.axiom.trade': '/api6',
  'api7.axiom.trade': '/api7',
  // BNB API endpoints
  'api1-bnb.axiom.trade': '/api1-bnb',
  'api2-bnb.axiom.trade': '/api2-bnb',
  // Eucalyptus (WebSocket clusters)
  'eucalyptus.axiom.trade': '/eucalyptus',
  'eucalyptus-bnb.axiom.trade': '/eucalyptus-bnb',
  // Friends
  'friends.axiom.trade': '/friends',
  // Docs (leave external but route through proxy)
  'docs.axiom.trade': '/docs',
};

// WebSocket specific mappings
const WS_DOMAINS = {
  'socket8.axiom.trade': '/ws/socket8',
  'cluster2.axiom.trade': '/ws/cluster2',
  'cluster3.axiom.trade': '/ws/cluster3',
  'cluster4.axiom.trade': '/ws/cluster4',
  'cluster5.axiom.trade': '/ws/cluster5',
  'cluster6.axiom.trade': '/ws/cluster6',
  'cluster7.axiom.trade': '/ws/cluster7',
  'cluster8.axiom.trade': '/ws/cluster8',
  'cluster9.axiom.trade': '/ws/cluster9',
  'cluster-asia2.axiom.trade': '/ws/cluster-asia2',
  'cluster-gcp-asia1.axiom.trade': '/ws/cluster-gcp-asia1',
  'cluster-gcp-aus1.axiom.trade': '/ws/cluster-gcp-aus1',
  'eucalyptus.axiom.trade': '/ws/eucalyptus',
  'eucalyptus-bnb.axiom.trade': '/ws/eucalyptus-bnb',
  'friends.axiom.trade': '/ws/friends',
};

function rewriteContent(content) {
  let modified = content;
  let changes = 0;

  // Replace WebSocket URLs for all known domains
  for (const [domain, wsPath] of Object.entries(WS_DOMAINS)) {
    const pattern = new RegExp(`wss://${domain.replace(/\./g, '\\.')}`, 'g');
    const replacement = PROXY_WS + wsPath;
    const matches = modified.match(pattern);
    if (matches) {
      changes += matches.length;
      modified = modified.replace(pattern, replacement);
    }
  }

  // Replace HTTPS URLs for all known domains
  for (const [domain, proxyPath] of Object.entries(ALL_DOMAINS)) {
    const pattern = new RegExp(`https://${domain.replace(/\./g, '\\.')}`, 'g');
    const replacement = PROXY_URL + proxyPath;
    const matches = modified.match(pattern);
    if (matches) {
      changes += matches.length;
      modified = modified.replace(pattern, replacement);
    }
  }

  // Replace main axiom.trade WebSocket
  const mainWsPattern = /wss:\/\/axiom\.trade/g;
  const mainWsMatches = modified.match(mainWsPattern);
  if (mainWsMatches) {
    changes += mainWsMatches.length;
    modified = modified.replace(mainWsPattern, PROXY_WS + '/ws/main');
  }

  // Replace main axiom.trade HTTPS
  const mainHttpsPattern = /https:\/\/axiom\.trade/g;
  const mainHttpsMatches = modified.match(mainHttpsPattern);
  if (mainHttpsMatches) {
    changes += mainHttpsMatches.length;
    modified = modified.replace(mainHttpsPattern, PROXY_URL);
  }

  // Catch-all: Replace any remaining wss://*.axiom.trade URLs
  const catchAllWsPattern = /wss:\/\/([a-zA-Z0-9\-]+)\.axiom\.trade/g;
  modified = modified.replace(catchAllWsPattern, (match, subdomain) => {
    changes++;
    return `${PROXY_WS}/ws/${subdomain}`;
  });

  // Catch-all: Replace any remaining https://*.axiom.trade URLs
  const catchAllHttpsPattern = /https:\/\/([a-zA-Z0-9\-]+)\.axiom\.trade/g;
  modified = modified.replace(catchAllHttpsPattern, (match, subdomain) => {
    changes++;
    return `${PROXY_URL}/${subdomain}`;
  });

  // Replace string references to "axiom.trade" (in double quotes)
  const quotedPattern = /"axiom\.trade"/g;
  const quotedMatches = modified.match(quotedPattern);
  if (quotedMatches) {
    changes += quotedMatches.length;
    modified = modified.replace(quotedPattern, '"axiom-backend-production.up.railway.app"');
  }

  // Replace string references to 'axiom.trade' (in single quotes)
  const singleQuotedPattern = /'axiom\.trade'/g;
  const singleQuotedMatches = modified.match(singleQuotedPattern);
  if (singleQuotedMatches) {
    changes += singleQuotedMatches.length;
    modified = modified.replace(singleQuotedPattern, "'axiom-backend-production.up.railway.app'");
  }

  // Replace any remaining axiom.trade domain references (standalone)
  const standalonePattern = /([^a-zA-Z0-9\-\.])axiom\.trade([^a-zA-Z0-9\-\.])/g;
  const standaloneMatches = modified.match(standalonePattern);
  if (standaloneMatches) {
    changes += standaloneMatches.length;
    modified = modified.replace(standalonePattern, '$1axiom-backend-production.up.railway.app$2');
  }

  return { content: modified, changes };
}

function processChunks() {
  const files = fs.readdirSync(CHUNKS_DIR);
  let totalChanges = 0;
  let filesModified = 0;

  for (const file of files) {
    if (!file.endsWith('.js')) continue;

    const filePath = path.join(CHUNKS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: rewritten, changes } = rewriteContent(content);

    if (changes > 0) {
      fs.writeFileSync(filePath, rewritten, 'utf8');
      console.log(`${file}: ${changes} changes`);
      totalChanges += changes;
      filesModified++;
    }
  }

  console.log(`\nTotal: ${totalChanges} changes across ${filesModified} files`);
}

processChunks();
