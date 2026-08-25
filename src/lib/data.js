/*
 * Title: Data Library
 * Description: Handle Data related work
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-20
 */

// dependencies
import fs from "node:fs/promises";
import path from "node:path";

// module scaffolding
const lib = {};

// find directory path of .data
lib.basePath = path.join(import.meta.dirname, "../.data");

// write data to file
lib.create = async (dir, file, data, callback) => {
  // convert data to string
  const stringData = JSON.stringify(data);
  let fileHandle;
  try {
    // make sub directory
    await fs.mkdir(path.join(lib.basePath, dir), {
      recursive: true,
    });
    // open the file
    fileHandle = await fs.open(
      path.join(lib.basePath, dir, `${file}.json`),
      "wx",
    );
    // write file
    await fileHandle.writeFile(stringData);

    callback(null);
  } catch (error) {
    callback(error);
  } finally {
    // close file
    if (fileHandle) await fileHandle.close();
  }
};

// read from file
lib.read = async (dir, file, callback) => {
  try {
    const data = await fs.readFile(
      path.join(lib.basePath, dir, `${file}.json`),
      "utf-8",
    );

    callback(null, data);
  } catch (error) {
    callback(error, null);
  }
};

// update file
lib.update = async (dir, file, data, callback) => {
  const stringData = JSON.stringify(data);
  let fileHandle;
  try {
    // open file
    fileHandle = await fs.open(
      path.join(lib.basePath, dir, `${file}.json`),
      "r+",
    );

    // remove all data from file
    await fileHandle.truncate();

    // write file
    await fileHandle.writeFile(stringData);

    callback(null);
  } catch (error) {
    callback(error);
  } finally {
    // close file
    if (fileHandle) {
      await fileHandle.close();
    }
  }
};

// delete file
lib.delete = async (dir, file, callback) => {
  try {
    await fs.unlink(path.join(lib.basePath, dir, `${file}.json`));

    callback(null);
  } catch (error) {
    callback(error);
  }
};

// list all checks
lib.list = async (dir, callback) => {
  try {
    const allChecks = await fs.readdir(path.join(lib.basePath, dir));
    let trimmedFileName = [];
    allChecks.forEach((check) => {
      trimmedFileName.push(check.replace(".json", ""));
    });

    callback(null, trimmedFileName);
  } catch (error) {
    callback(error, null);
  }
};

export const {
  create: createData,
  read: readData,
  update: updateData,
  delete: deleteData,
  list: listData,
} = lib;
