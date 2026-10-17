// --- CONFIGURATION FIREBASE ---
const FIREBASE_DB_URL = "https://depense-family-default-rtdb.europe-west1.firebasedatabase.app/";

let currentQ = 0;
let auditScore = 0;
let userPoints = parseInt(localStorage.getItem("cyber_points")) || 120;
let phishFoundCount = 0;

document.getElementById("userPoints").textContent = userPoints;

// --- GESTION DE LA MODALE D'ALERTE INCIDENT ---
const modal = document.getElementById("alertModal");
document.getElementById("openAlertModal").onclick = () => { modal.style.display = "flex"; };
document.getElementById("closeModal").onclick = () => { modal.style.display = "none"; };

document.getElementById("submitIncident").onclick = () => {
  const desc = document.getElementById("incidentDesc").value.trim();
  if (!desc) {
    alert("Veuillez décrire brièvement l'incident.");
    return;
  }

  const newIncident = { description: desc, date: new Date().toLocaleTimeString(), status: "🔴 URGENCE" };

  fetch(`${FIREBASE_DB_URL}/cyber_incidents.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newIncident)
  })
  .then(() => {
    document.getElementById("incidentDesc").value = "";
    modal.style.display = "none";
    alert("🚨 Alerte transmise au Responsable IT avec succès !");
    fetchIncidentsFromFirebase();
  })
  .catch(err => alert("Erreur lors de l'envoi de l'alerte : " + err));
};

function fetchIncidentsFromFirebase() {
  fetch(`${FIREBASE_DB_URL}/cyber_incidents.json`)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("incidentList");
      list.replaceChildren();
      
      if (!data) {
        const li = document.createElement("li");
        li.style.color = "var(--mute)";
        li.style.fontSize = "0.85rem";
        li.textContent = "Aucun incident signalé pour le moment.";
        list.append(li);
        return;
      }

      Object.keys(data).forEach(key => {
        const inc = data[key];
        const li = document.createElement("li");
        li.className = "incident-item";
        li.innerHTML = `<div><b>⚠️ Incident :</b> ${inc.description}<br><small style="color:var(--mute)">Signalé à ${inc.date}</small></div><span class="status-badge" style="background:rgba(239,68,68,0.2);color:var(--danger)">${inc.status}</span>`;
        list.append(li);
      });
    })
    .catch(err => console.error("Erreur chargement incidents:", err));
}

// --- SIMULATION DE PHISHING INTERACTIVE ---
function findPhishIndex(id, element) {
  if (element.classList.contains("found")) return;
  element.classList.add("found");
  phishFoundCount++;
  
  const feedback = document.getElementById("phishFeedback");
  if (phishFoundCount === 3) {
    userPoints += 100;
    savePoints();
    document.getElementById("phishBadge").style.opacity = "1";
    feedback.style.color = "var(--accent)";
    feedback.textContent = "🎉 Excellent ! Vous avez identifié tous les pièges de ce phishing (+100 pts et badge débloqué).";
  } else {
    feedback.style.color = "var(--warn)";
    feedback.textContent = `⚠️ Bien vu ! Indice ${phishFoundCount}/3 trouvé. Encore ${3 - phishFoundCount} à trouver.`;
  }
}

function savePoints() {
  localStorage.setItem("cyber_points", userPoints);
  document.getElementById("userPoints").textContent = userPoints;
}

document.getElementById("completeModuleBtn").onclick = () => {
  userPoints += 50;
  savePoints();
  const btn = document.getElementById("completeModuleBtn");
  btn.textContent = "Module validé ! 🎉";
  btn.style.background = "var(--accent)";
  btn.style.color = "var(--bg)";
  btn.disabled = true;
};

// --- AUTODIAGNOSTIC PME (10 QUESTIONS) ---
const questions = [
  { title: "1. Vos données critiques font-elles l'objet de sauvegardes hors-ligne régulières ?", opts: [{ text: "Oui, automatisées et isolées", pts: 3 }, { text: "Locales sur le même réseau", pts: 1 }, { text: "Aucune sauvegarde", pts: 0 }] },
  { title: "2. Utilisez-vous l'authentification multifacteur (MFA) pour vos accès ?", opts: [{ text: "Oui, sur tous les services", pts: 3 }, { text: "Partiellement", pts: 1 }, { text: "Non", pts: 0 }] },
  { title: "3. Vos collaborateurs ont-ils suivi une formation anti-phishing ?", opts: [{ text: "Oui, régulièrement", pts: 3 }, { text: "Une seule fois", pts: 1 }, { text: "Jamais", pts: 0 }] },
  { title: "4. Disposez-vous d'une politique formalisée de mots de passe robustes ?", opts: [{ text: "Oui (gestionnaire de mots de passe / règles strictes)", pts: 3 }, { text: "Recommandations orales", pts: 1 }, { text: "Aucune règle", pts: 0 }] },
  { title: "5. Vos logiciels et systèmes d'exploitation sont-ils mis à jour régulièrement ?", opts: [{ text: "Mises à jour automatiques gérées par l'IT", pts: 3 }, { text: "Mises à jour manuelles occasionnelles", pts: 1 }, { text: "Rarement mis à jour", pts: 0 }] },
  { title: "6. Avez-vous un plan de continuité ou de reprise d'activité (PRA) en cas de cyberattaque ?", opts: [{ text: "Oui, testé chaque année", pts: 3 }, { text: "Document théorique existant", pts: 1 }, { text: "Aucun plan", pts: 0 }] },
  { title: "7. Les accès des salariés partis de l'entreprise sont-ils révoqués immédiatement ?", opts: [{ text: "Oui, procédure automatisée", pts: 3 }, { text: "Fait de temps en temps", pts: 1 }, { text: "Souvent oubliés", pts: 0 }] },
  { title: "8. Utilisez-vous un antivirus ou une solution EDR mise à jour sur tous les postes ?", opts: [{ text: "Oui, solution professionnelle centralisée", pts: 3 }, { text: "Antivirus de base gratuit", pts: 1 }, { text: "Pas de protection active", pts: 0 }] },
  { title: "9. Le réseau Wi-Fi de l'entreprise est-il sécurisé et séparé pour les invités ?", opts: [{ text: "Oui, VLAN invité isolé et WPA3", pts: 3 }, { text: "Même Wi-Fi pour tous", pts: 1 }, { text: "Non sécurisé", pts: 0 }] },
  { title: "10. Sensibilisez-vous régulièrement vos équipes aux risques liés aux clés USB et supports externes ?", opts: [{ text: "Oui, consignes claires et contrôles", pts: 3 }, { text: "Sensibilisation rapide", pts: 1 }, { text: "Aucune consigne", pts: 0 }] }
];

function loadQuestion() {
  const q = questions[currentQ];
  document.getElementById("qTitle").textContent = q.title;
  const optBox = document.getElementById("qOptions");
  optBox.replaceChildren();
  
  q.opts.forEach(o => {
    const btn = document.createElement("button");
    btn.className = "opt-btn";
    btn.textContent = o.text;
    btn.onclick = () => answerAudit(o.pts);
    optBox.append(btn);
  });
}

function answerAudit(pts) {
  auditScore += pts;
  currentQ++;
  if (currentQ < questions.length) {
    loadQuestion();
  } else {
    showAuditReport();
  }
}

function showAuditReport() {
  const maxPts = questions.length * 3;
  const pct = Math.round((auditScore / maxPts) * 100);
  
  document.getElementById("globalScore").textContent = pct + "%";
  const status = document.getElementById("scoreStatus");
  
  let riskLevel = "Faible";
  if (pct < 50) riskLevel = "Critique 🚨";
  else if (pct < 80) riskLevel = "Moyen ⚠️";

  status.textContent = `Niveau de risque : ${riskLevel} - Score : ${auditScore}/${maxPts}`;
  
  let reportHTML = `<b>📄 RAPPORT D'AUDIT OFFICIEL - CYBERALERT PRO</b><br>` +
                   `• Indice de conformité : <b>${pct}%</b><br>` +
                   `• Niveau de risque global : <b>${riskLevel}</b><br><br>` +
                   `<b>Recommandations prioritaires :</b><br>` +
                   (pct < 80 ? `- Mettre en place des sauvegardes hors-ligne régulières.<br>- Activer la double authentification (MFA) sur tous les postes.<br>- Lancer des campagnes de sensibilisation aux salariés.` : `- Excellente posture de sécurité. Maintenez vos veilles régulières.`);

  document.getElementById("auditContainer").style.display = "none";
  const res = document.getElementById("auditResult");
  res.className = "report-result";
  res.innerHTML = reportHTML + `<br><button class="go" id="printPdfBtn" style="background:var(--accent);color:var(--bg);margin-top:10px;">📥 Télécharger le Rapport d'Audit PDF</button>` +
                                `<button class="go" onclick="restartAudit()" style="margin-top:8px;background:var(--bg);border:1px solid var(--line);">Recommencer l'audit</button>`;

  document.getElementById("printPdfBtn").onclick = () => {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Rapport d'Audit CyberAlert Pro</title></head><body style="font-family:sans-serif; padding:30px;"><h2>Rapport d'Audit de Sécurité - CyberAlert Pro</h2><p>${reportHTML.replace(/<br>/g, '<br>')}</p><hr><p>Document généré automatiquement par CyberAlert Pro B2B</p></body></html>`);
    w.document.close();
    w.print();
  };
}

function restartAudit() {
  currentQ = 0;
  auditScore = 0;
  document.getElementById("auditContainer").style.display = "block";
  document.getElementById("auditResult").innerHTML = "";
  document.getElementById("auditResult").className = "";
  loadQuestion();
}

// --- GESTION ADMIN & FIREBASE ---
let collaborators = [];

function fetchCollaboratorsFromFirebase() {
  fetch(`${FIREBASE_DB_URL}/cyber_collaborators.json`)
    .then(res => res.json())
    .then(data => {
      collaborators = [];
      if (data) {
        Object.keys(data).forEach(key => {
          collaborators.push({ firebaseId: key, ...data[key] });
        });
      } else {
        collaborators = [
          { name: "Awa Kaboré", email: "a.kabore@entreprise.com", trained: false },
          { name: "Moussa Ouédraogo", email: "m.ouedraogo@entreprise.com", trained: true }
        ];
      }
      renderCollaborators();
    })
    .catch(err => {
      console.error("Erreur de chargement Firebase:", err);
      renderCollaborators();
    });
}

function renderCollaborators() {
  const list = document.getElementById("collabList");
  list.replaceChildren();
  
  let trainedCount = 0;
  collaborators.forEach(c => {
    if (c.trained) trainedCount++;
    const li = document.createElement("li");
    li.className = "collab-item";
    li.innerHTML = `<div class="collab-info"><b>${c.name}</b><small>${c.email}</small></div><span class="status-badge ${c.trained ? 'trained' : 'pending'}">${c.trained ? 'Formé ✅' : 'À former ⚠️'}</span>`;
    list.append(li);
  });

  const trainingPct = collaborators.length > 0 ? Math.round((trainedCount / collaborators.length) * 100) : 0;
  document.getElementById("trainingPct").textContent = trainingPct + "%";
  document.getElementById("analyticsFill").style.width = trainingPct + "%";
}

document.getElementById("addCollabBtn").onclick = () => {
  const nameInput = document.getElementById("collabName");
  const emailInput = document.getElementById("collabEmail");
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  if (!name || !email) return;

  const newCollab = { name, email, trained: false };

  fetch(`${FIREBASE_DB_URL}/cyber_collaborators.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newCollab)
  })
  .then(() => {
    nameInput.value = "";
    emailInput.value = "";
    fetchCollaboratorsFromFirebase();
  })
  .catch(err => alert("Erreur lors de l'enregistrement : " + err));
};

// Initialisation au chargement
window.onload = () => {
  loadQuestion();
  fetchCollaboratorsFromFirebase();
  fetchIncidentsFromFirebase();
};