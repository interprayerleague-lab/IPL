-- Migration: Seed initial curriculum
-- Description: Create the initial programme with 3 modules and 9 lessons
-- Author: AI Agent
-- Date: 2026-11-09

-- Insert the initial programme
INSERT INTO public.programmes (id, title, slug, description, is_published, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Foundations of Discipleship',
    'foundations-of-discipleship',
    'A comprehensive discipleship programme covering the foundations of faith, the Holy Spirit, and Christian disciplines.',
    false, -- Not published yet, admin will publish when ready
    now(),
    now()
);

-- Get the programme ID for use in subsequent inserts
DO $$
DECLARE
    v_programme_id UUID;
    v_module1_id UUID;
    v_module2_id UUID;
    v_module3_id UUID;
BEGIN
    -- Get the programme ID
    SELECT id INTO v_programme_id FROM public.programmes WHERE slug = 'foundations-of-discipleship';

    -- Module 1: Foundations of Faith
    INSERT INTO public.modules (id, programme_id, title, slug, description, learning_objectives, sequence_number, is_published, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        v_programme_id,
        'Foundations of Faith',
        'foundations-of-faith',
        'Understanding the core foundations of Christian faith: repentance, salvation, and water baptism.',
        jsonb_build_array(
            'Understand the biblical meaning of repentance',
            'Comprehend the doctrine of salvation',
            'Learn the significance of water baptism'
        ),
        1,
        false,
        now(),
        now()
    )
    RETURNING id INTO v_module1_id;

    -- Module 1 Lessons
    INSERT INTO public.lessons (module_id, title, slug, description, sequence_number, is_required, is_published, created_at, updated_at)
    VALUES
        (v_module1_id, 'Repentance', 'repentance', 'Understanding true repentance and its role in the Christian life.', 1, true, false, now(), now()),
        (v_module1_id, 'Salvation', 'salvation', 'Exploring the biblical doctrine of salvation through Jesus Christ.', 2, true, false, now(), now()),
        (v_module1_id, 'Water Baptism', 'water-baptism', 'The meaning and practice of water baptism in the life of a believer.', 3, true, false, now(), now());

    -- Module 2: The Holy Spirit
    INSERT INTO public.modules (id, programme_id, title, slug, description, learning_objectives, sequence_number, is_published, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        v_programme_id,
        'The Holy Spirit',
        'the-holy-spirit',
        'Discovering the person and work of the Holy Spirit: baptism, gifts, and fruit.',
        jsonb_build_array(
            'Understand the baptism of the Holy Spirit',
            'Identify and operate in the gifts of the Spirit',
            'Cultivate the fruit of the Spirit in daily life'
        ),
        2,
        false,
        now(),
        now()
    )
    RETURNING id INTO v_module2_id;

    -- Module 2 Lessons
    INSERT INTO public.lessons (module_id, title, slug, description, sequence_number, is_required, is_published, created_at, updated_at)
    VALUES
        (v_module2_id, 'Baptism of the Holy Spirit', 'baptism-of-the-holy-spirit', 'Understanding and receiving the baptism of the Holy Spirit.', 1, true, false, now(), now()),
        (v_module2_id, 'Gifts of the Spirit', 'gifts-of-the-spirit', 'Exploring the nine gifts of the Holy Spirit and their operation.', 2, true, false, now(), now()),
        (v_module2_id, 'Fruit of the Spirit', 'fruit-of-the-spirit', 'Cultivating the nine-fold fruit of the Spirit in your character.', 3, true, false, now(), now());

    -- Module 3: Christian Disciplines
    INSERT INTO public.modules (id, programme_id, title, slug, description, learning_objectives, sequence_number, is_published, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        v_programme_id,
        'Christian Disciplines',
        'christian-disciplines',
        'Mastering essential spiritual disciplines: fasting, prayer, and Word study.',
        jsonb_build_array(
            'Practice biblical fasting',
            'Develop a consistent prayer life',
            'Study and apply God''s Word effectively'
        ),
        3,
        false,
        now(),
        now()
    )
    RETURNING id INTO v_module3_id;

    -- Module 3 Lessons
    INSERT INTO public.lessons (module_id, title, slug, description, sequence_number, is_required, is_published, created_at, updated_at)
    VALUES
        (v_module3_id, 'Fasting', 'fasting', 'Understanding and practicing biblical fasting as a spiritual discipline.', 1, true, false, now(), now()),
        (v_module3_id, 'Prayer', 'prayer', 'Developing an effective and consistent prayer life.', 2, true, false, now(), now()),
        (v_module3_id, 'Word Study', 'word-study', 'Methods and practices for studying and applying the Bible.', 3, true, false, now(), now());

END $$;

-- Add comments
COMMENT ON TABLE public.programmes IS 'Initial programme: Foundations of Discipleship with 3 modules seeded';
COMMENT ON TABLE public.modules IS 'Initial modules: Foundations of Faith, The Holy Spirit, Christian Disciplines';
COMMENT ON TABLE public.lessons IS 'Initial 9 lessons seeded (3 per module)';
