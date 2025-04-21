const {Octokit} = require('ocotokit')

async function fetchRepoDetails(username, repoName, accessToken) {
  try{
    const octokit = new Octokit({
        auth: accessToken
    });

    const response = await octokit.request('GET /repos/{owner}/{repo}',{
        owner: username,
        repo: repoName,
        headers: {
            'X-Github-Api-Version': '2022-11-28'
        }
    });

    const languageResponse = await octokit.request(
        'GET /repos/{owner}/{repo}/languages',
        {
            owner: username,
            repo: repoName,
            headers: {
                'X-Github-Api-Version': '2022-11-28'
            }
        }
    );

    const languages = languageResponse.data;
    return {...response.data, languages};
  }catch(error){
    console.error(`Error fetching repository details: ${error}`)
    throw error;
  }
}

async function fetchRepoPullRequest(username, repoName, accessToken){
    try{
        const octokit = new Octokit({
            auth: accessToken,
        });

        const response = await octokit.request('GET /repos/{owner}/{repo}/pulls',{
            owner: username,
            repo: repoName,
            state: 'closed',
            sort: 'updated',
            direction: 'desc',
            per_page: 2,
            headers: {
                'X-Github-Api-Version': '2022-11-28',
            },
        })
        return response.data
    }catch(error){
        console.error(`Error fetching repository pull request: ${error}`);
        throw error;
    }
}

module.exports = {fetchRepoDetails, fetchRepoPullRequest}