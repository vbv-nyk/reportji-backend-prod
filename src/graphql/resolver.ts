import { exec, execSync } from "child_process";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import { pool } from "../database/postgres-config.js";
import { QueryResult } from "pg";
import { create } from "domain";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import generateReportWithLLM from "../llm/reportGenerator.js";
import { text } from "stream/consumers";

type Document = {
  name: string;
  pages: string;
  url: string;
  document_id: number;
};
export const resolvers = {
  Mutation: {
    CreateTexFile: async (parent, args, context, info) => {
      try {
        const { inputJi, name, pagesData, docID } = args;
        const { id } = context.user;
        fs.mkdir(`outputs/${id}`, { recursive: true });
        await fs.writeFile(`outputs/${id}/input.ji`, inputJi, "utf-8");
        execSync(`./main outputs/${id}/input.ji`);
        const data = await fs.readFile("output.tex");
        const tex = data.toString();

        if (docID) {
          const update_pdf = await pool.query(
            `update documents 
              set pages = $1, name = $2
              where user_id = $3 and document_id = $4
              returning document_id
            `, [pagesData, name, id, docID]
          )
          console.log(update_pdf);
          return {
            document_id: update_pdf.rows[0].document_id,
            err: false,
            errMsg: "None",
            tex,
          };
        } else {
          const create_pdf = await pool.query(
            `insert into documents (user_id, name, pages) 
          values ($1, $2, $3)
          returning document_id;
        `,
            [id, name, pagesData]
          );
          return {
            document_id: create_pdf.rows[0].document_id,
            err: false,
            errMsg: "None",
            tex,
          };
        }

      } catch (err) {
        console.log(err);
        return {
          err: true,
          errMessage: err,
          tex: `Error ${err}`,
        };
      }
    },
    CreateReportWithLLM: async (parent, args, context, info) => {
      try {
        const { prompt } = args;
        const report = JSON.stringify(await generateReportWithLLM({ userPrompt: prompt }));
        return report
      } catch (err) {
        console.log(err);
        return {
          err: true,
          errMessage: err,
          tex: `Error ${err}`,
        };
      }
    },
    CreatePDF: async (parent, args, context, info) => {
      const { id } = context.user;
      const {
        texFile,
        docID
      }: { texFile: string, docID: number } = args;
      const newDocID = uuidv4()
      console.log(`PDF Generation: user ${id}, document ${docID}`)
      try {
        console.log("Creating a directory for the user");
        await fs.mkdir(`outputs/${id}`, { recursive: true });
        await fs.writeFile(`outputs/${id}/output.tex`, texFile, "utf-8");
        console.log("Running pdflatex");
        execSync(
          `pdflatex -interaction=nonstopmode -output-directory=outputs/${id} output.tex || true`
        );
        execSync(
          `pdflatex -interaction=nonstopmode -output-directory=outputs/${id} output.tex || true`
        );
        // execSync(
        // `rm outputs/${id}/output.aux outputs/${id}/output.lof outputs/${id}/output.log outputs/${id}/output.toc outputs/${id}/output.out`
        // );

        console.log("Compiled, now reading the file");
        let pdf = await fs.readFile(`outputs/${id}/output.pdf`);
        const client = new S3Client({ region: "eu-north-1", credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } });
        const command = new PutObjectCommand({ Body: pdf, Key: `${id}/${newDocID}`, Bucket: "reportease", ContentType: "application/pdf" });
        const response = await client.send(command);
        // console.log(response);
        const url = `https://reportease.s3.eu-north-1.amazonaws.com/${id}/${newDocID}`;
        // const new_url = await pool.query(`
        //   update documents
        //   set url = $1 
        //   where user_id = $2 and document_id = $3
        //   `, [url, id, docID]);
        return {
          err: false,
          errMsg: "None",
          pdf: url,
        };
      } catch (err) {
        const url = `https://reportease.s3.eu-north-1.amazonaws.com/${id}/${newDocID}`;
        console.error(err);
        return {
          err: true,
          errMessage: err,
          pdf: url,
        };
      }
    },
  },
  Query: {
    UserDetails: (parent, args, context, info) => {
      const { id, displayName } = context.user;
      return {
        id,
        displayName,
      };
    },
  },
};
