// local dependencies
import * as store from '../db/store';
import * as Types from '../db/db-types';
import * as ScratchTypes from './scratchx-types';
import * as TrainingTypes from '../training/training-types';





async function createTextKey(project: Types.Project): Promise<ScratchTypes.Key> {
    const textClassifiers = await store.getConversationWorkspaces(project.id);

    if (textClassifiers.length === 0) {
        const id = await store.storeUntrainedScratchKey(
            project.id, project.name, project.type,
            project.userid, project.classid);
        return { id };
    }
    else {
        const classifier = textClassifiers[0];
        const model = classifier.workspace_id;

        const credentials = await store.getServiceCredentials(
            project.id, project.classid, project.userid,
            'conv', classifier.workspace_id);

        const id = await store.storeOrUpdateScratchKey(
            project.id, project.type,
            project.userid, project.classid,
            credentials, classifier.workspace_id);

        return { id, model };
    }
}

async function createNumbersKey(project: Types.Project): Promise<ScratchTypes.Key> {
    const numClassifiers = await store.getNumbersClassifiers(project.id);

    if (numClassifiers.length === 0) {
        const id = await store.storeUntrainedScratchKey(
            project.id, project.name, project.type,
            project.userid, project.classid);
        return { id };
    }
    else {
        const credentials: TrainingTypes.BluemixCredentials = {
            servicetype: 'num',
            id: 'NOTUSED',
            url: 'tenantid=' + project.classid + '&' +
                'studentid=' + project.userid + '&' +
                'projectid=' + project.id,
            username: project.userid,
            password: project.classid,
        };

        const id = await store.storeOrUpdateScratchKey(
            project.id, 'numbers',
            project.userid, project.classid,
            credentials,
            project.id);

        return { id, model : project.id };
    }
}



export async function createKey(projectid: string): Promise<ScratchTypes.Key>
{
    const project = await store.getProject(projectid);

    if (project.type === 'text') {
        return createTextKey(project);
    }
    else if (project.type === 'numbers') {
        return createNumbersKey(project);
    }
    else {
        throw new Error('Not implemented yet');
    }
}
