import Category from "../models/category";
import { ICategory, CategoryProps } from "../interface/category";
import { categoryCacheKey, redis } from "../config/redisConfig";

const searchCategory = async (_: string, args: { name: string }) => {
  try {
    const categorieList: string[] =
      (await redis.lrange(categoryCacheKey, 0, -1)) || [];
    const list = categorieList.map((x: string) => JSON.parse(x)) || [];

    const category = list.find((c: CategoryProps) => c.name === args.name);

    if (category?.parentId) {
      category.parentId = list.find(
        (c: CategoryProps) => c._id === category.parentId
      );
      delete category.parentId?.createdAt;
      delete category.parentId?.updatedAt;
      delete category.parentId?.__v;
    }
    return category;
  } catch (error) {
    throw error;
  }
};

const listCategory = async () => {
  try {
    const categorieList: string[] =
      (await redis.lrange(categoryCacheKey, 0, -1)) || [];
    const categories: CategoryProps[] = (
      categorieList.map((x: string) => JSON.parse(x)) || []
    ).filter((c: CategoryProps) => !c.parentId);

    if (categories.length <= 0) {
      const listCategory: CategoryProps[] = await Category.find({
        status: true,
      });

      const categoryStrings = listCategory.map((c: CategoryProps) =>
        JSON.stringify(c)
      );
      await redis.lpush(categoryCacheKey, ...categoryStrings);
      return listCategory.filter((c: CategoryProps) => !c.parentId);
    }
    return categories;
  } catch (error) {
    throw error;
  }
};

const getAllchieldCategory = async (_: string, args: { id: string }) => {
  try {
    const categorieList: string[] =
      (await redis.lrange(categoryCacheKey, 0, -1)) || [];
    const list = categorieList.map((x: string) => JSON.parse(x)) || [];

    const category: CategoryProps = list.find(
      (c: CategoryProps) => c._id === args.id
    );

    let chields: CategoryProps[] = [];

    if (category) {
      chields = list.filter((c: CategoryProps) => c.parentId === args.id);
    }
    return { parent: category, chields: chields };
  } catch (error) {
    throw error;
  }
};

const createCategory = async (_: string, args: { input: ICategory }) => {
  try {
    const { name, parentId, status } = args.input;
    const doesExist: CategoryProps | null = await Category.findOne({ name });

    if (doesExist) {
      throw new Error(`${name} category already exists`);
    }

    const category: ICategory = new Category({
      name,
      parentId,
      status: status,
    });
    await category.save();

    redis.lpush(categoryCacheKey, JSON.stringify(category));

    return category;
  } catch (error) {
    throw error;
  }
};

const deactiveAndActiveHandlingChildCategory = async (
  ids: (string | undefined)[],
  status: boolean
) => {
  let hasChield = true;
  while (hasChield && ids) {
    try {
      const categories = await Category.updateMany(
        { parentId: { $in: ids } },
        { $set: { status: status } },
        { multi: true }
      );

      if (categories.modifiedCount > 0) {
        const listCategory: CategoryProps[] | null = await Category.find({
          parentId: { $in: ids },
        }).select("_id");

        const listIds: (string | undefined)[] = listCategory
          ? listCategory?.map((cat: CategoryProps) => cat._id)
          : [];

        if (listIds && listIds.length > 0) {
          deactiveAndActiveHandlingChildCategory(listIds, status);
        } else {
          hasChield = false;
        }
      }
      break;
    } catch (error) {
      throw error;
    }
  }
  return;
};

const updateCategory = async (_: string, args: { input: ICategory }) => {
  try {
    const { id, name, status } = args.input;
    const category: CategoryProps | null = await Category.findById(id);

    if (category) {
      const previousStatus = category.status === true ? true : false;
      category.name = name || category.name;
      category.status = status === false ? false : status || category.status;

      await category.save();

      await redis.del(categoryCacheKey);

      // active and deactive handler
      previousStatus !== status && (status || status === false)
        ? deactiveAndActiveHandlingChildCategory([id], status)
        : undefined;
    }
    return category;
  } catch (error) {
    throw error;
  }
};

const deleteCategory = async (_: string, args: { id: string }) => {
  try {
    const category: CategoryProps | null = await Category.findByIdAndRemove({
      _id: args.id,
    });

    await Category.updateMany(
      { parentId: args.id },
      { $set: { parentId: null } },
      { multi: true }
    );

    await redis.del(categoryCacheKey);

    return category;
  } catch (error) {
    throw error;
  }
};

export default {
  Query: {
    listCategory,
    searchCategory,
    getAllchieldCategory,
  },
  Mutation: {
    createCategory,
    updateCategory,
    deleteCategory,
  },
};
