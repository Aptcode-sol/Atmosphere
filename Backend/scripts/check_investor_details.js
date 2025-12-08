const mongoose = require('mongoose');
const { InvestorDetails, User } = require('../models');
const { connect } = require('../index');

(async function(){
  await connect();
  const user = await User.findOne({ email: 'sanket@gmail.com' });
  console.log('user', user && user._id, 'accountType', user && user.accountType, 'roles', user && user.roles);
  const docs = await InvestorDetails.find({ user: user._id }).lean();
  console.log('InvestorDetails docs count:', docs.length);
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
})();
