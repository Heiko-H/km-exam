PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS techniques (id TEXT PRIMARY KEY, category TEXT NOT NULL, text TEXT NOT NULL, details TEXT, modification_date TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS technique_translations (technique_id TEXT NOT NULL REFERENCES techniques(id) ON DELETE CASCADE, language TEXT NOT NULL, text TEXT NOT NULL, details TEXT, PRIMARY KEY (technique_id, language));

CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY, text TEXT NOT NULL, modification_date TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS tag_translations (tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE, language TEXT NOT NULL, text TEXT NOT NULL, PRIMARY KEY (tag_id, language));

CREATE TABLE IF NOT EXISTS technique_tags (technique_id TEXT NOT NULL REFERENCES techniques(id) ON DELETE CASCADE, tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY (technique_id, tag_id));

CREATE TABLE IF NOT EXISTS general_exams (id TEXT PRIMARY KEY, name TEXT NOT NULL, level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5), modification_date TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS general_exam_techniques (exam_id TEXT NOT NULL REFERENCES general_exams(id) ON DELETE CASCADE, technique_id TEXT NOT NULL REFERENCES techniques(id), order_index INTEGER NOT NULL, PRIMARY KEY (exam_id, technique_id), UNIQUE (exam_id, order_index));

INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('technique-1-abwehr-von-haken', 'level-1', 'Abwehr von Haken', 'Auf Distanz und mit stabiler Deckung arbeiten.', '2026-11-24');
INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('technique-1-taktisches-gehen', 'level-1', 'Taktisches gehen', 'Bewege dich kontrolliert und behalte den Gegner im Blick.', '2026-11-24');
INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('technique-1-fallschule-nach-vorne', 'level-1', 'Fallschule nach vorne', 'Schütze Kopf und Gelenke bei der Vorwärtsrolle.', '2026-11-24');
INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('technique-2-verteidigung-gegen-frontkick', 'level-2', 'Verteidigung gegen Frontkick', 'Distanz schließen und den Gegenangriff kontrolliert ausführen.', '2026-11-24');
INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('technique-2-verteidigung-gegen-mittelstufekick', 'level-2', 'Verteidigung gegen Mittelstufekick', 'Achte auf Deckung und sichere Distanz nach der Abwehr.', '2026-11-24');
INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('technique-3-abwehr-gegen-angriff-mit-baseballschlager', 'level-3', 'Abwehr gegen Angriff mit Baseballschläger', 'Sicherheit und Fluchtmöglichkeit haben Vorrang.', '2026-11-24');
INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('technique-3-boden-mount-wurgen-am-hals', 'level-3', 'Boden Mount, würgen am Hals', 'Schütze den Hals und arbeite an einer kontrollierten Befreiung.', '2026-11-24');
INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('technique-4-messbedrohnung-au-en-am-hals', 'level-4', 'Messbedrohnung (außen) am Hals', 'Vermeide unnötige Bewegungen und löse dich kontrolliert.', '2026-11-24');
INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('technique-4-messerangriff-kommando', 'level-4', 'Messerangriff Kommando', 'Setze eine klare Bewegung mit anschließender Flucht um.', '2026-11-24');
INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('technique-4-messerangriff-eispickel', 'level-4', 'Messerangriff Eispickel', 'Schütze Kopf und Körper und verlasse die Gefahrenzone.', '2026-11-24');
INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('technique-5-bedrohung-pistole-kopf-frontal', 'level-5', 'Bedrohung Pistole Kopf frontal', 'Priorität hat eine sichere Lagebeurteilung und Deeskalation.', '2026-11-24');
INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('technique-5-bedrohung-pistole-bauch-frontal', 'level-5', 'Bedrohung Pistole Bauch frontal', 'Handle kontrolliert und nutze eine sichere Fluchtmöglichkeit.', '2026-11-24');
INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('sparring-2', 'general', 'Sparring (2 Gegner)', 'Prüfung gegen zwei Gegner gleichzeitig.', '2026-11-24');
INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('sparring-3', 'general', 'Sparring (3 Gegner)', 'Prüfung gegen drei Gegner gleichzeitig.', '2026-11-24');
INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('shadowboxing', 'general', 'Schattenboxen', 'Techniken und Kombinationen ohne Partner ausführen.', '2026-11-24');
INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('grappling', 'general', 'Grappling', 'Bodenkampf mit einem Trainingspartner.', '2026-11-24');
INSERT INTO techniques (id, category, text, details, modification_date) VALUES ('opponent-circle', 'general', 'Gegner-Zirkel', 'Mehrere Gegner nacheinander abwehren.', '2026-11-24');

INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-1-abwehr-von-haken', 'en', 'Defense against hooks', 'Maintain distance and a stable guard.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-1-abwehr-von-haken', 'fr', 'Défense contre les crochets', 'Maintenez la distance et une garde stable.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-1-abwehr-von-haken', 'it', 'Difesa dai ganci', 'Mantieni la distanza e una guardia stabile.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-1-abwehr-von-haken', 'es', 'Defensa contra ganchos', 'Mantén la distancia y una guardia estable.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-1-taktisches-gehen', 'en', 'Tactical movement', 'Move in a controlled way and keep the opponent in view.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-1-taktisches-gehen', 'fr', 'Déplacements tactiques', 'Déplacez-vous de manière contrôlée et gardez l’adversaire en vue.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-1-taktisches-gehen', 'it', 'Spostamenti tattici', 'Muoviti in modo controllato e tieni l’avversario sotto controllo visivo.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-1-taktisches-gehen', 'es', 'Desplazamiento táctico', 'Muévete de forma controlada y mantén al oponente a la vista.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-1-fallschule-nach-vorne', 'en', 'Forward breakfall', 'Protect your head and joints during the forward roll.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-1-fallschule-nach-vorne', 'fr', 'Chute avant', 'Protégez la tête et les articulations pendant la roulade avant.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-1-fallschule-nach-vorne', 'it', 'Caduta in avanti', 'Proteggi la testa e le articolazioni durante la capriola in avanti.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-1-fallschule-nach-vorne', 'es', 'Caída hacia delante', 'Protege la cabeza y las articulaciones durante la voltereta hacia delante.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-2-verteidigung-gegen-frontkick', 'en', 'Defense against a front kick', 'Close the distance and perform the counterattack with control.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-2-verteidigung-gegen-frontkick', 'fr', 'Défense contre un coup de pied frontal', 'Réduisez la distance et exécutez la contre-attaque avec contrôle.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-2-verteidigung-gegen-frontkick', 'it', 'Difesa da un calcio frontale', 'Riduci la distanza ed esegui il contrattacco in modo controllato.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-2-verteidigung-gegen-frontkick', 'es', 'Defensa contra una patada frontal', 'Acorta la distancia y ejecuta el contraataque de forma controlada.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-2-verteidigung-gegen-mittelstufekick', 'en', 'Defense against a mid-level kick', 'Maintain your guard and create safe distance after the defense.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-2-verteidigung-gegen-mittelstufekick', 'fr', 'Défense contre un coup de pied au niveau moyen', 'Gardez votre garde et créez une distance de sécurité après la défense.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-2-verteidigung-gegen-mittelstufekick', 'it', 'Difesa da un calcio al livello medio', 'Mantieni la guardia e crea una distanza di sicurezza dopo la difesa.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-2-verteidigung-gegen-mittelstufekick', 'es', 'Defensa contra una patada a media altura', 'Mantén la guardia y crea una distancia segura después de defenderte.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-3-abwehr-gegen-angriff-mit-baseballschlager', 'en', 'Defense against a baseball bat attack', 'Prioritize safety and an opportunity to escape.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-3-abwehr-gegen-angriff-mit-baseballschlager', 'fr', 'Défense contre une attaque à la batte de baseball', 'La sécurité et la possibilité de fuir sont prioritaires.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-3-abwehr-gegen-angriff-mit-baseballschlager', 'it', 'Difesa da un attacco con mazza da baseball', 'Dai la priorità alla sicurezza e alla possibilità di fuggire.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-3-abwehr-gegen-angriff-mit-baseballschlager', 'es', 'Defensa contra un ataque con bate de béisbol', 'Prioriza la seguridad y la posibilidad de escapar.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-3-boden-mount-wurgen-am-hals', 'en', 'Ground mount position, choke at the neck', 'Protect your neck and work toward a controlled escape.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-3-boden-mount-wurgen-am-hals', 'fr', 'Position montée au sol, étranglement au cou', 'Protégez votre cou et cherchez à vous dégager de manière contrôlée.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-3-boden-mount-wurgen-am-hals', 'it', 'Posizione di mount a terra, strangolamento al collo', 'Proteggi il collo e cerca di liberarti in modo controllato.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-3-boden-mount-wurgen-am-hals', 'es', 'Posición de montada en el suelo, estrangulamiento al cuello', 'Protege el cuello y trabaja para liberarte de forma controlada.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-4-messbedrohnung-au-en-am-hals', 'en', 'Knife threat to the neck from the outside', 'Avoid unnecessary movement and disengage in a controlled way.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-4-messbedrohnung-au-en-am-hals', 'fr', 'Menace au couteau au cou, par l’extérieur', 'Évitez les mouvements inutiles et dégagez-vous avec contrôle.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-4-messbedrohnung-au-en-am-hals', 'it', 'Minaccia di coltello al collo dall’esterno', 'Evita movimenti inutili e allontanati in modo controllato.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-4-messbedrohnung-au-en-am-hals', 'es', 'Amenaza con cuchillo al cuello desde el exterior', 'Evita movimientos innecesarios y libérate de forma controlada.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-4-messerangriff-kommando', 'en', 'Knife attack drill', 'Use a decisive movement followed by an escape.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-4-messerangriff-kommando', 'fr', 'Exercice d’attaque au couteau', 'Effectuez un mouvement décisif, puis mettez-vous à l’abri.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-4-messerangriff-kommando', 'it', 'Esercizio di attacco con coltello', 'Esegui un movimento deciso seguito da una fuga.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-4-messerangriff-kommando', 'es', 'Ejercicio de ataque con cuchillo', 'Realiza un movimiento decidido y después escapa.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-4-messerangriff-eispickel', 'en', 'Ice-pick knife attack', 'Protect your head and body and leave the danger zone.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-4-messerangriff-eispickel', 'fr', 'Attaque au couteau en prise pic à glace', 'Protégez la tête et le corps, puis quittez la zone dangereuse.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-4-messerangriff-eispickel', 'it', 'Attacco con coltello a piccozza', 'Proteggi la testa e il corpo e allontanati dalla zona di pericolo.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-4-messerangriff-eispickel', 'es', 'Ataque con cuchillo en posición de picahielo', 'Protege la cabeza y el cuerpo y sal de la zona de peligro.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-5-bedrohung-pistole-kopf-frontal', 'en', 'Frontal gun threat to the head', 'Prioritize assessing the situation safely and de-escalating.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-5-bedrohung-pistole-kopf-frontal', 'fr', 'Menace frontale avec une arme à feu pointée vers la tête', 'Évaluez la situation en sécurité et privilégiez la désescalade.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-5-bedrohung-pistole-kopf-frontal', 'it', 'Minaccia frontale con arma da fuoco alla testa', 'Dai priorità alla valutazione sicura della situazione e alla de-escalation.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-5-bedrohung-pistole-kopf-frontal', 'es', 'Amenaza frontal con arma de fuego en la cabeza', 'Prioriza evaluar la situación con seguridad y reducir la tensión.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-5-bedrohung-pistole-bauch-frontal', 'en', 'Frontal gun threat to the abdomen', 'Act with control and use a safe opportunity to escape.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-5-bedrohung-pistole-bauch-frontal', 'fr', 'Menace frontale avec une arme à feu pointée vers l’abdomen', 'Agissez avec contrôle et profitez d’une possibilité de fuite sûre.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-5-bedrohung-pistole-bauch-frontal', 'it', 'Minaccia frontale con arma da fuoco all’addome', 'Agisci con controllo e sfrutta un’opportunità sicura per fuggire.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('technique-5-bedrohung-pistole-bauch-frontal', 'es', 'Amenaza frontal con arma de fuego en el abdomen', 'Actúa con control y aprovecha una oportunidad segura para escapar.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('sparring-2', 'en', 'Sparring (2 opponents)', 'Test against two opponents at the same time.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('sparring-2', 'fr', 'Combat (2 adversaires)', 'Épreuve face à deux adversaires simultanément.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('sparring-2', 'it', 'Sparring (2 avversari)', 'Prova contro due avversari contemporaneamente.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('sparring-2', 'es', 'Combate (2 oponentes)', 'Prueba contra dos oponentes al mismo tiempo.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('sparring-3', 'en', 'Sparring (3 opponents)', 'Test against three opponents at the same time.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('sparring-3', 'fr', 'Combat (3 adversaires)', 'Épreuve face à trois adversaires simultanément.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('sparring-3', 'it', 'Sparring (3 avversari)', 'Prova contro tre avversari contemporaneamente.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('sparring-3', 'es', 'Combate (3 oponentes)', 'Prueba contra tres oponentes al mismo tiempo.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('shadowboxing', 'en', 'Shadowboxing', 'Perform techniques and combinations without a partner.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('shadowboxing', 'fr', 'Boxe dans le vide', 'Exécutez des techniques et des combinaisons sans partenaire.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('shadowboxing', 'it', 'Shadow boxing', 'Esegui tecniche e combinazioni senza un compagno.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('shadowboxing', 'es', 'Sombra', 'Ejecuta técnicas y combinaciones sin compañero.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('grappling', 'en', 'Grappling', 'Ground fighting with a training partner.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('grappling', 'fr', 'Lutte au sol', 'Combat au sol avec un partenaire d’entraînement.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('grappling', 'it', 'Grappling', 'Lotta a terra con un compagno di allenamento.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('grappling', 'es', 'Grappling', 'Combate en el suelo con un compañero de entrenamiento.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('opponent-circle', 'en', 'Opponent circuit', 'Defend against several opponents one after another.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('opponent-circle', 'fr', 'Enchaînement d’adversaires', 'Défendez-vous contre plusieurs adversaires les uns après les autres.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('opponent-circle', 'it', 'Circuito di avversari', 'Difenditi da più avversari uno dopo l’altro.');
INSERT INTO technique_translations (technique_id, language, text, details) VALUES ('opponent-circle', 'es', 'Circuito de oponentes', 'Defiéndete de varios oponentes uno tras otro.');

INSERT INTO tags (id, text, modification_date) VALUES ('pistol', 'Pistole', '2026-11-24');
INSERT INTO tags (id, text, modification_date) VALUES ('knife', 'Messer', '2026-11-24');
INSERT INTO tags (id, text, modification_date) VALUES ('baton', 'Baton', '2026-11-24');
INSERT INTO tags (id, text, modification_date) VALUES ('strike', 'Schlag', '2026-11-24');
INSERT INTO tags (id, text, modification_date) VALUES ('kick', 'Tritt', '2026-11-24');
INSERT INTO tags (id, text, modification_date) VALUES ('ground', 'Boden', '2026-11-24');

INSERT INTO tag_translations (tag_id, language, text) VALUES ('pistol', 'en', 'Pistol');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('pistol', 'fr', 'Pistolet');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('pistol', 'it', 'Pistola');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('pistol', 'es', 'Pistola');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('knife', 'en', 'Knife');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('knife', 'fr', 'Couteau');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('knife', 'it', 'Coltello');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('knife', 'es', 'Cuchillo');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('baton', 'en', 'Baton');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('baton', 'fr', 'Bâton');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('baton', 'it', 'Bastone');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('baton', 'es', 'Bastón');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('strike', 'en', 'Strike');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('strike', 'fr', 'Coup');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('strike', 'it', 'Colpo');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('strike', 'es', 'Golpe');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('kick', 'en', 'Kick');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('kick', 'fr', 'Coup de pied');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('kick', 'it', 'Calcio');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('kick', 'es', 'Patada');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('ground', 'en', 'Ground');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('ground', 'fr', 'Sol');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('ground', 'it', 'Terre');
INSERT INTO tag_translations (tag_id, language, text) VALUES ('ground', 'es', 'Suelo');

INSERT INTO technique_tags (technique_id, tag_id) VALUES ('technique-1-abwehr-von-haken', 'strike');
INSERT INTO technique_tags (technique_id, tag_id) VALUES ('technique-2-verteidigung-gegen-frontkick', 'kick');
INSERT INTO technique_tags (technique_id, tag_id) VALUES ('technique-2-verteidigung-gegen-mittelstufekick', 'kick');
INSERT INTO technique_tags (technique_id, tag_id) VALUES ('technique-3-abwehr-gegen-angriff-mit-baseballschlager', 'baton');
INSERT INTO technique_tags (technique_id, tag_id) VALUES ('technique-3-boden-mount-wurgen-am-hals', 'strike');
INSERT INTO technique_tags (technique_id, tag_id) VALUES ('technique-3-boden-mount-wurgen-am-hals', 'ground');
INSERT INTO technique_tags (technique_id, tag_id) VALUES ('technique-4-messerangriff-kommando', 'knife');
INSERT INTO technique_tags (technique_id, tag_id) VALUES ('technique-4-messerangriff-eispickel', 'knife');
INSERT INTO technique_tags (technique_id, tag_id) VALUES ('technique-5-bedrohung-pistole-kopf-frontal', 'pistol');
INSERT INTO technique_tags (technique_id, tag_id) VALUES ('technique-5-bedrohung-pistole-bauch-frontal', 'pistol');

COMMIT;
