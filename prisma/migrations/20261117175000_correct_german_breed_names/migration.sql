-- Correct German breed names without changing IDs, slugs or relations.
UPDATE breeds SET name_de = replace(name_de, 'Schaferhund', 'Schäferhund');
UPDATE breeds SET name_de = replace(name_de, 'Schaeferhund', 'Schäferhund');
UPDATE breeds SET name_de = replace(name_de, 'Mittelgrosser', 'Mittelgroßer');
UPDATE breeds SET name_de = replace(name_de, 'Grosser', 'Großer');
UPDATE breeds SET name_de = replace(name_de, 'Weiss', 'Weiß');
UPDATE breeds SET name_de = replace(name_de, 'Pyrenaen', 'Pyrenäen');
UPDATE breeds SET name_de = replace(name_de, 'Hutehund', 'Hütehund');
UPDATE breeds SET name_de = replace(name_de, 'Groenlandhund', 'Grönlandhund');
UPDATE breeds SET name_de = replace(name_de, 'Französicher', 'Französischer');
UPDATE breeds SET name_de = replace(name_de, 'Cao Fila De Sao Miguel', 'Cão de Fila de São Miguel');
UPDATE breeds SET name_de = replace(name_de, 'Vendeen', 'Vendéen');
UPDATE breeds SET name_de = replace(name_de, 'Tulear', 'Tuléar');
UPDATE breeds SET name_de = replace(name_de, 'Bichon Frise', 'Bichon Frisé');
