import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const port = process.env.PORT || 4000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`HR Admin backend listening on port ${port}`);
});
