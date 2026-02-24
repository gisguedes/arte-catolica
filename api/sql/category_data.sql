-- insert data into categories table
INSERT INTO categories (id, alias, is_active, created_at, updated_at, image_url) VALUES
(uuid_generate_v4(), 'sculptures', true, NOW(), NOW(), '/images/categories/sculptures.jpg'),
(uuid_generate_v4(), 'paintings-iconography', true, NOW(), NOW(), '/images/categories/paintings-iconography.jpg'),
(uuid_generate_v4(), 'religious-jewelry', true, NOW(), NOW(), '/images/categories/religious-jewelry.jpg'),
(uuid_generate_v4(), 'crosses-crucifixes', true, NOW(), NOW(), '/images/categories/crosses-crucifixes.jpg'),
(uuid_generate_v4(), 'art-prints-editorial', true, NOW(), NOW(), '/images/categories/art-prints-editorial.jpg'),
(uuid_generate_v4(), 'liturgical-art', true, NOW(), NOW(), '/images/categories/liturgical-art.jpg');

-- tradccion ES
INSERT INTO category_translations (id, category_id, locale, name, description, content, slug)
SELECT uuid_generate_v4(), c.id, 'es', v.name_es, v.desc_es, v.content_es, v.slug_es
FROM categories c
JOIN (VALUES
('sculptures',
'Escultura Religiosa',
'Imágenes y obras escultóricas de inspiración cristiana creadas por artistas.',
'Descubre esculturas religiosas únicas realizadas por artistas contemporáneos y tradicionales. Obras en madera, bronce, piedra y otros materiales que representan santos, Vírgenes, Cristos y escenas sagradas con profundidad espiritual y valor artístico.',
'escultura-religiosa'),

('paintings-iconography',
'Pintura e Iconografía',
'Pinturas, iconos y obras bidimensionales de temática cristiana.',
'Explora pinturas e iconos religiosos creados por artistas que trabajan distintas técnicas y estilos, desde la tradición bizantina hasta el arte contemporáneo. Obras que transmiten fe, simbolismo y belleza atemporal.',
'pintura-iconografia'),

('religious-jewelry',
'Joyería de Inspiración Cristiana',
'Collares, rosarios y piezas de joyería creadas con inspiración cristiana.',
'Una colección de joyería religiosa diseñada por artistas y artesanos que integran fe y creatividad. Rosarios, medallas, pulseras y collares elaborados con cuidado y sentido espiritual.',
'joyeria-cristiana'),

('crosses-crucifixes',
'Cruces y Crucifijos',
'Cruces artísticas y crucifijos elaborados por creadores especializados.',
'Cruces y crucifijos realizados en diversos materiales y estilos, desde interpretaciones clásicas hasta propuestas contemporáneas. Obras que combinan significado espiritual y expresión artística.',
'cruces-crucifijos'),

('art-prints-editorial',
'Arte Impreso y Editorial',
'Láminas, grabados y publicaciones de arte cristiano.',
'Grabados, ediciones limitadas, libros ilustrados y arte impreso que difunden el trabajo de artistas de temática cristiana. Una forma accesible de acercarse al arte sacro contemporáneo y tradicional.',
'arte-impreso-editorial'),

('liturgical-art',
'Arte Litúrgico',
'Obras y objetos artísticos destinados al culto y la liturgia.',
'Piezas de arte litúrgico creadas por artistas especializados: vestimentas, objetos de altar y obras destinadas al culto. Diseño, simbolismo y tradición al servicio de la celebración.',
'arte-liturgico')

) AS v(alias, name_es, desc_es, content_es, slug_es)
ON c.alias = v.alias;

-- traduccion EN
INSERT INTO category_translations (id, category_id, locale, name, description, content, slug)
SELECT uuid_generate_v4(), c.id, 'en', v.name_en, v.desc_en, v.content_en, v.slug_en
FROM categories c
JOIN (VALUES
('sculptures',
'Religious Sculpture',
'Sculptural works inspired by Christian tradition.',
'Discover unique religious sculptures created by contemporary and traditional artists. Works in wood, bronze, stone, and other materials depicting saints, the Virgin Mary, Christ, and sacred scenes with artistic depth and spiritual meaning.',
'religious-sculpture'),

('paintings-iconography',
'Painting and Iconography',
'Paintings and icons rooted in Christian artistic tradition.',
'Explore religious paintings and icons created by artists working across different techniques and styles, from Byzantine tradition to contemporary sacred art. Works that express faith, symbolism, and timeless beauty.',
'painting-iconography'),

('religious-jewelry',
'Christian Inspired Jewelry',
'Rosaries, necklaces, and handcrafted jewelry inspired by faith.',
'A curated collection of religious jewelry designed by artists and artisans who combine faith and creativity. Rosaries, medals, bracelets, and necklaces crafted with intention and spiritual significance.',
'christian-inspired-jewelry'),

('crosses-crucifixes',
'Crosses and Crucifixes',
'Artistic crosses and crucifixes created in various styles.',
'Crosses and crucifixes crafted in diverse materials and artistic styles, from classical representations to contemporary interpretations. Pieces that unite spiritual meaning with artistic expression.',
'crosses-crucifixes'),

('art-prints-editorial',
'Art Prints and Editorial',
'Prints, engravings, and publications of Christian art.',
'Engravings, limited editions, illustrated books, and printed works that showcase the creativity of Christian artists. An accessible way to bring sacred art into daily life.',
'art-prints-editorial'),

('liturgical-art',
'Liturgical Art',
'Artistic works and objects created for worship and liturgy.',
'Liturgical art pieces designed by specialized artists, including vestments and altar objects. Tradition, symbolism, and craftsmanship serving the celebration of faith.',
'liturgical-art')

) AS v(alias, name_en, desc_en, content_en, slug_en)
ON c.alias = v.alias;
