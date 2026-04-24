# Git / GitHub — identifiants et popup « choix de compte »

## Contexte

Après l’ajout d’un second compte GitHub (`operateurpeco10`, ex. dépôt vote) en plus de `pacomeamanlaman`, Windows enregistrait **plusieurs identifiants** pour le même hôte `https://github.com`. Les `push` sur les dépôts `pacomeamanlaman` pouvaient alors afficher une **popup de choix de compte** (comportement normal du gestionnaire d’identifiants / Git Credential Manager).

## Ce qui a été fait dans ce dépôt (`school`)

Activation **locale** (uniquement pour ce clone) de :

```ini
credential.useHttpPath = true
```

Effet : Git associe les identifiants à l’**URL complète du dépôt** (ex. `github.com/pacomeamanlaman-lab/school.git`) plutôt qu’au seul domaine `github.com`, ce qui **réduit les collisions** avec d’autres repos (ex. vote sur un autre compte).

- Fichier concerné : `.git/config` (local, **non versionné**).
- Un **commit vide de test** a servi à valider un `push` après ce réglage (`chore: test push (credential.useHttpPath local)`).

## Option pour tous les projets sur la machine

Pour appliquer la même règle **à tous les dépôts** :

```bash
git config --global credential.useHttpPath true
```

## Si la popup revient

1. **Gestionnaire d’identifiants Windows** → *Informations d’identification Windows* et *génériques* → repérer les entrées `git:https://github.com...` en double ou obsolètes.
2. Ne garder qu’**un** identifiant cohérent par compte / par dépôt selon ton usage.
3. Alternative propre : **SSH** pour un compte, **HTTPS** pour l’autre (séparation nette).

---

*Note rédigée pour mémoire d’équipe — pas de secret ni de token dans ce fichier.*
