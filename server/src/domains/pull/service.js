const logger = require("../../libraries/log/logger");
const Model = require("./schema");
const User = require("../user/schema");

const { AppError } = require("../../libraries/error-handling/AppError");
const github = require("../../libraries/util/githubUtils");
const { decryptToken } = require("../../auth");

const model = "pull";

const create = async (data) => {
  try {
    const item = new Model(data);
    const saved = await item.save();

    logger.info(`create(): ${model} created`, {
      id: saved._id,
    });
    return saved;
  } catch (error) {
    logger.error(`create(): Failed to create ${model}`, error);
    throw new AppError(`Failed to create ${model}`, error.message);
  }
};

const search = async (query) => {
  try {
    const { keyword } = query ?? {};
    const filter = {};

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $option: "i" } },
        { description: { $regex: keyword, $option: "i" } },
      ];
    }

    const items = await Model.find(filter).sort({ updated_at: -1 });

    logger.info(`search(): filter and count`, {
      filter,
      count: items.length,
    });

    return items;
  } catch (error) {
    logger.error(`search(): Failed to search ${model}`, error);
    throw new AppError(`Failed to search ${model}`, error.message, 400);
  }
};

const getById = async (id) => {
  try {
    const item = await Model.findById(id);
    logger.info(`getById(): ${model} fetched`, { id });
    return item;
  } catch (error) {
    logger.error(`getById(): Failed to get ${model}`, error);
    throw new AppError(`Failed to get ${model}`, error.message);
  }
};

const updateById = async (id, data) => {
  try {
    const item = await Model.findByIdAndUpdate(id, data, { new: true });
    logger.info(`updateById(): ${model} updated`, { id });
    return item;
  } catch (error) {
    logger.error(`updateById(): Failed to update ${model}`, error);
    throw new AppError(`Failed to update ${model}`, error.message);
  }
};

const deleteById = async (id) => {
  try {
    await Model.findByIdAndDelete(id);
    logger.info(`deleteById(): ${model} deleted`, { id });
    return true;
  } catch (error) {
    logger.error(`deleteById(): Failed to delete ${model}`, error);
    throw new AppError(`Failed to delete ${model}`, error.message);
  }
};

const mapPullRequestData = (payload) => {
  return {
    id: payload.id,
    node_id: payload.node_id,
    html_url: payload.html_url,
    number: payload.number,
    state: payload.state,
    locked: payload.locked,
    title: payload.title,

    user: {
      login: payload.user.login,
      id: payload.user.id,
      node_id: payload.user.node_id,
      avatar_url: payload.user.avatar_url,
      type: payload.user.type,
    },

    created_at: new Date(payload.created_at),
    updated_at: new Date(payload.updated_at),
    closed_at: payload.closed_at ? new Date(payload.closed_at) : null,
    merged_at: payload.merged_at ? new Date(payload.merged_at) : null,
    draft: payload.draft,

    merged: payload.merged,
    comments: payload.comments,
    review_comments: payload.review_comments,
    commits: payload.commits,
    additions: payload.additions,
    deletions: payload.deletions,
    changed_files: payload.changed_files,

    source_branch: {
      id: payload.head.repo.id,
      node_id: payload.head.repo.node_id,
      name: payload.head.ref,
      full_name: payload.head.repo.full_name,
    },

    target_branch: {
      id: payload.head.repo.id,
      node_id: payload.head.repo.node_id,
      name: payload.head.repo.ref,
      full_name: payload.head.repo.full_name,
    },
  };
};

const fetchGithubPullRequests = async (user) => {
  try {
    const { _id } = user;
    const dbUser = await User.findById(_id).exec();
    const { accessToken, accessTokenIV, csFollowingRepositories } = dbUser;
    const token = decryptToken(accessToken, accessTokenIV);

    const repoPromises = csFollowingRepositories.map(async (repo) => {
      const { _id } = repo;
      const dbRepository = await repository.findById(_id).exec();
      const { owner, name } = dbRepository;

      const pullRequests = await fetchRepoPullRequest(owner.login, name, token);

      const mappedPullRequests = pullRequests.map(mapPullRequestData);
      const promises = mappedPullRequests.map(async (pullRequests) => {
        const dbPull = await Model.findOne({ id: pullRequests.id }).exec();

        if (dbPull) {
          logger.info(
            "fetchGithubPullRequests(): Pull request already exists",
            {
              id: dbPull._id,
            }
          );
          return dbPull;
        }

        const saved = await create(pullRequests);

        return saved;
      });
      return Promise.all(promises);
    });

    const result = await Promise.all(repoPromises);
    logger.info('fetchGithubPullRequests(): Pull requests fetched', {
        const: result.length,
    })

    return result;
  } catch (error) {
    throw new AppError("Failed to fetch repository details", error.message);
  }
};

module.exports = {
  create,
  search,
  getById,
  updateById,
  deleteById,
  fetchGithubPullRequests
};
