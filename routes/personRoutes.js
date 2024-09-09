const express = require('express');
const router = express.Router();
const { Person, Work } = require('../models/person');
const redis = require('../config/redis');

// Función de caché (mantén esta función como estaba antes)
const cacheResponse = async (key, cb) => {
    const cached = await redis.hget('persons', key);
    if (cached) {
        return JSON.parse(cached);
    }
    const result = await cb();
    await redis.hset('persons', key, JSON.stringify(result));
    return result;
};

// GET /persons
router.get('/', async (req, res, next) => {
    try {
        const persons = await cacheResponse('all', async () => {
            return await Person.findAll({ include: Work });
        });
        res.json(persons);
    } catch (error) {
        next(error);
    }
});

// GET /persons/:id
router.get('/:id', async (req, res, next) => {
    try {
        const person = await cacheResponse(`person:${req.params.id}`, async () => {
            return await Person.findByPk(req.params.id, { include: Work });
        });
        if (!person) {
            return res.status(404).json({ message: 'Person not found' });
        }
        res.json(person);
    } catch (error) {
        next(error);
    }
});

// POST /persons
router.post('/', async (req, res, next) => {
    try {
        const { works, ...personData } = req.body;
        const person = await Person.create(personData);
        if (works && works.length > 0) {
            await Work.bulkCreate(works.map(work => ({ ...work, PersonId: person.id })));
        }
        await redis.hdel('persons', 'all');
        res.status(201).json(await Person.findByPk(person.id, { include: Work }));
    } catch (error) {
        next(error);
    }
});

// DELETE /persons/:id
router.delete('/:id', async (req, res, next) => {
    try {
        console.log(`Attempting to delete person with id: ${req.params.id}`);
        const deleted = await Person.destroy({
            where: { id: req.params.id },
        });
        if (deleted) {
            console.log(`Person with id ${req.params.id} deleted successfully`);
            await redis.hdel('persons', 'all', `person:${req.params.id}`);
            res.status(204).end();
        } else {
            console.log(`Person with id ${req.params.id} not found for deletion`);
            res.status(404).json({ message: 'Person not found' });
        }
    } catch (error) {
        console.error('Error deleting person:', error);
        next(error);
    }
});

// PUT /persons/:id
router.put('/:id', async (req, res, next) => {
    try {
        console.log(`Attempting to update person with id: ${req.params.id}`);
        console.log('Update data:', req.body);
        const { Works, ...personData } = req.body;
        const [updated] = await Person.update(personData, {
            where: { id: req.params.id },
        });
        if (updated) {
            const person = await Person.findByPk(req.params.id);
            if (Works) {
                await Work.destroy({ where: { PersonId: person.id } });
                await Work.bulkCreate(Works.map(work => ({ ...work, PersonId: person.id })));
            }
            await redis.hdel('persons', 'all', `person:${req.params.id}`);
            const updatedPerson = await Person.findByPk(person.id, { include: Work });
            console.log('Person updated successfully:', updatedPerson);
            res.json(updatedPerson);
        } else {
            console.log(`Person with id ${req.params.id} not found for update`);
            res.status(404).json({ message: 'Person not found' });
        }
    } catch (error) {
        console.error('Error updating person:', error);
        next(error);
    }
});

// GET /persons/:id/works
router.get('/:id/works', async (req, res, next) => {
    try {
        const person = await Person.findByPk(req.params.id, { include: Work });
        if (!person) {
            return res.status(404).json({ message: 'Person not found' });
        }
        res.json(person.Works);
    } catch (error) {
        next(error);
    }
});

// POST /persons/:id/works
router.post('/:id/works', async (req, res, next) => {
    try {
        const person = await Person.findByPk(req.params.id);
        if (!person) {
            return res.status(404).json({ message: 'Person not found' });
        }
        const work = await Work.create({ ...req.body, PersonId: person.id });
        await redis.hdel('persons', 'all', `person:${req.params.id}`);
        res.status(201).json(work);
    } catch (error) {
        next(error);
    }
});

// PUT /persons/:id/works/:workId
router.put('/:id/works/:workId', async (req, res, next) => {
    try {
        const [updated] = await Work.update(req.body, {
            where: { id: req.params.workId, PersonId: req.params.id },
        });
        if (updated) {
            const work = await Work.findByPk(req.params.workId);
            await redis.hdel('persons', 'all', `person:${req.params.id}`);
            res.json(work);
        } else {
            res.status(404).json({ message: 'Work not found' });
        }
    } catch (error) {
        next(error);
    }
});

// DELETE /persons/:id/works/:workId
router.delete('/:id/works/:workId', async (req, res, next) => {
    try {
        const deleted = await Work.destroy({
            where: { id: req.params.workId, PersonId: req.params.id },
        });
        if (deleted) {
            await redis.hdel('persons', 'all', `person:${req.params.id}`);
            res.status(204).end();
        } else {
            res.status(404).json({ message: 'Work not found' });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
