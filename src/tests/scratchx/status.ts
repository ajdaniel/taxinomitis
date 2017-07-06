/*eslint-env mocha */
import * as assert from 'assert';
import * as uuid from 'uuid/v1';
import * as sinon from 'sinon';
import * as proxyquire from 'proxyquire';
import * as conversation from '../../lib/training/conversation';
import * as status from '../../lib/scratchx/status';
import * as Types from '../../lib/db/db-types';
import * as TrainingTypes from '../../lib/training/training-types';


describe('Scratchx - status', () => {

    describe('text projects', () => {

        const testStatus: TrainingTypes.ConversationWorkspace = {
            name : 'TEST PROJECT',
            status : 'Available',
            workspace_id : uuid(),
            created : new Date(),
            language : 'en',
            url : 'conversation.url',
        };
        let getStatusStub;

        before(() => {
            getStatusStub = sinon.stub(conversation, 'getStatus').resolves(testStatus);
            proxyquire('../../lib/scratchx/status', {
                '../training/conversation' : {
                    getStatus : getStatusStub,
                },
            });
        });
        after(() => {
            getStatusStub.restore();
        });


        it('should return status 0 for untrained projects', async () => {
            const key: Types.ScratchKey = {
                id : uuid(),
                name : 'TEST',
                type : 'text',
                projectid : uuid(),
            };

            const statusObj = await status.getStatus(key);
            assert.deepEqual(statusObj, {
                status : 0,
                msg : 'No models trained yet - only random answers can be chosen',
            });
        });



        it('should return status 0 for classifiers that have been deleted', async () => {
            const key: Types.ScratchKey = {
                id : uuid(),
                name : 'TEST',
                type : 'text',
                projectid : uuid(),
                classifierid : testStatus.workspace_id,
                credentials : {
                    url : 'http',
                    id : uuid(),
                    username : 'user',
                    password : 'pass',
                    servicetype : 'conv',
                },
            };

            testStatus.status = 'Non Existent';

            const statusObj = await status.getStatus(key);
            assert.deepEqual(statusObj, {
                status : 0,
                msg : 'Model Non Existent',
            });
        });



        it('should return status 1 for projects that are still training', async () => {
            const key: Types.ScratchKey = {
                id : uuid(),
                name : 'TEST',
                type : 'text',
                projectid : uuid(),
                classifierid : testStatus.workspace_id,
                credentials : {
                    url : 'http',
                    id : uuid(),
                    username : 'user',
                    password : 'pass',
                    servicetype : 'conv',
                },
            };

            testStatus.status = 'Training';

            const statusObj = await status.getStatus(key);
            assert.deepEqual(statusObj, {
                status : 1,
                msg : 'Model not ready yet',
            });
        });


        it('should return status 2 for trained projects', async () => {
            const key: Types.ScratchKey = {
                id : uuid(),
                name : 'TEST',
                type : 'text',
                projectid : uuid(),
                classifierid : testStatus.workspace_id,
                credentials : {
                    url : 'http',
                    id : uuid(),
                    username : 'user',
                    password : 'pass',
                    servicetype : 'conv',
                },
            };

            testStatus.status = 'Available';

            const statusObj = await status.getStatus(key);
            assert.deepEqual(statusObj, {
                status : 2,
                msg : 'Ready',
            });
        });
    });


    describe('numbers projects', () => {

        it('should return status 0 for untrained projects', async () => {
            const key: Types.ScratchKey = {
                id : uuid(),
                name : 'TEST',
                type : 'numbers',
                projectid : uuid(),
            };

            const statusObj = await status.getStatus(key);
            assert.deepEqual(statusObj, {
                status : 0,
                msg : 'No models trained yet - only random answers can be chosen',
            });
        });


        it('should return a placeholder status', async () => {
            const key: Types.ScratchKey = {
                id : uuid(),
                name : 'TEST',
                type : 'numbers',
                projectid : uuid(),
                classifierid : uuid(),
            };

            const statusObj = await status.getStatus(key);
            assert.deepEqual(statusObj, {
                status : 2,
                msg : 'PLACEHOLDER for TEST',
            });
        });


    });


    describe('images projects', () => {

        it('should return status 0 for untrained projects', async () => {
            const key: Types.ScratchKey = {
                id : uuid(),
                name : 'TEST',
                type : 'images',
                projectid : uuid(),
            };

            const statusObj = await status.getStatus(key);
            assert.deepEqual(statusObj, {
                status : 0,
                msg : 'No models trained yet - only random answers can be chosen',
            });
        });


        it('should return an error status', async () => {
            const key: Types.ScratchKey = {
                id : uuid(),
                name : 'TEST',
                type : 'images',
                projectid : uuid(),
                classifierid : uuid(),
            };

            const statusObj = await status.getStatus(key);
            assert.deepEqual(statusObj, {
                status : 0,
                msg : 'Not implemented yet',
            });
        });
    });


});
