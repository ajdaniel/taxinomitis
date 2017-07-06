/*eslint-env mocha */
import * as assert from 'assert';
import * as uuid from 'uuid/v1';
import * as sinon from 'sinon';
import * as proxyquire from 'proxyquire';
import * as request from 'request-promise';
import * as store from '../../lib/db/store';
import * as conversation from '../../lib/training/conversation';
import * as classifier from '../../lib/scratchx/classify';
import * as Types from '../../lib/db/db-types';
import * as TrainingTypes from '../../lib/training/training-types';



const TESTCLASS = 'UNIQUECLASSID';


describe('Scratchx - classify', () => {

    before(() => {
        return store.init();
    });

    after(async () => {
        await store.deleteProjectsByClassId(TESTCLASS);
        return store.disconnect();
    });




    describe('text projects', () => {


        it('should require text', async () => {
            const key: Types.ScratchKey = {
                id : uuid(),
                name : 'TEST',
                type : 'text',
                projectid : uuid(),
            };

            try {
                await classifier.classify(key, '  ');
                assert.fail(0, 1, 'Should not reach here', '');
            }
            catch (err) {
                assert.equal(err.message, 'Missing data');
            }
        });



        it('should return random classes for projects without classifiers', async () => {
            const userid = uuid();
            const project = await store.storeProject(userid, TESTCLASS, 'text', 'test project', []);
            await store.addLabelToProject(userid, TESTCLASS, project.id, 'animal');
            await store.addLabelToProject(userid, TESTCLASS, project.id, 'vegetable');
            await store.addLabelToProject(userid, TESTCLASS, project.id, 'mineral');

            const key: Types.ScratchKey = {
                id : uuid(),
                name : 'TEST',
                type : 'text',
                projectid : project.id,
            };

            const classifications = await classifier.classify(key, 'text to be classified');
            assert.equal(classifications.length, 3);
            for (const classification of classifications) {
                assert(classification.random);
                assert.equal(classification.confidence, 33);
            }
        });



        it('should return Conversation classes for projects with classifiers', async () => {
            const requestPostStub = sinon.stub(request, 'post').resolves({
                intents : [
                    {
                        intent : 'BETA',
                        confidence : 0.84,
                    },
                    {
                        intent : 'ALPHA',
                        confidence : 0.16,
                    },
                ],
                entities : [],
                input : {
                    text : 'question text',
                },
                output : {
                    text : [],
                    nodes_visited : [],
                    warning : 'No dialog node matched for the input at a root level. ' +
                                '(and there is 1 more warning in the log)',
                    log_messages : [
                        {
                            level : 'warn',
                            msg : 'No dialog node matched for the input at a root level.',
                        },
                        {
                            level : 'warn',
                            msg : 'No dialog node condition matched to true in the last dialog round - ' +
                                    'context.nodes_visited is empty. Falling back to the root node in the next round.',
                        },
                    ],
                },
                context : {
                    conversation_id : uuid(),
                    system : {
                        dialog_stack : [
                            {
                                dialog_node : 'root',
                            },
                        ],
                        dialog_turn_counter : 1,
                        dialog_request_counter : 1,
                    },
                },
            });



            proxyquire('../../lib/training/conversation', {
                'request-promise' : {
                    post : requestPostStub,
                },
            });

            const userid = uuid();
            const project = await store.storeProject(userid, TESTCLASS, 'text', 'test project', []);
            await store.addLabelToProject(userid, TESTCLASS, project.id, 'ALPHA');
            await store.addLabelToProject(userid, TESTCLASS, project.id, 'BETA');

            const key: Types.ScratchKey = {
                id : uuid(),
                name : 'TEST',
                type : 'text',
                projectid : project.id,
                classifierid : 'good',
                credentials : {
                    id : uuid(),
                    username : 'user',
                    password : 'pass',
                    servicetype : 'conv',
                    url : 'url',
                },
            };

            const classifications = await classifier.classify(key, 'text to be classified');
            assert.deepEqual(classifications, [
                { class_name: 'BETA', confidence: 84 },
                { class_name: 'ALPHA', confidence: 16 },
            ]);

            requestPostStub.restore();
        });


    });



    describe('numbers projects', () => {


        it('should require numbers', async () => {
            const key: Types.ScratchKey = {
                id : uuid(),
                name : 'TEST',
                type : 'numbers',
                projectid : uuid(),
            };

            try {
                await classifier.classify(key, []);
                assert.fail(0, 1, 'Should not reach here', '');
            }
            catch (err) {
                assert.equal(err.message, 'Missing data');
            }
        });



        it('should return random classes for projects without classifiers', async () => {
            const userid = uuid();
            const project = await store.storeProject(userid, TESTCLASS, 'numbers', 'test project', ['size']);
            await store.addLabelToProject(userid, TESTCLASS, project.id, 'fruit');
            await store.addLabelToProject(userid, TESTCLASS, project.id, 'vegetable');

            const key: Types.ScratchKey = {
                id : uuid(),
                name : 'TEST',
                type : 'numbers',
                projectid : project.id,
            };

            const classifications = await classifier.classify(key, ['123']);
            assert.equal(classifications.length, 2);
            for (const classification of classifications) {
                assert(classification.random);
                assert.equal(classification.confidence, 50);
            }
        });


    });



    describe('images projects', () => {

        it('should return an error status', async () => {
            const key: Types.ScratchKey = {
                id : uuid(),
                name : 'TEST',
                type : 'images',
                projectid : uuid(),
                classifierid : uuid(),
            };

            try {
                await classifier.classify(key, '{}');
                assert.fail(0, 1, 'Should not reach here', '');
            }
            catch (err) {
                assert.equal(err.message, 'Not implemented yet');
            }
        });
    });
});
