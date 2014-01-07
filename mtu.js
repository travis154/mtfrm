var schema = mongoose.Schema({
	business_name:'string',
	business_reg:'string',
	business_addr:'string',
	business_phone:'string',
	business_fax:'string',
	business_email:'string',
	business_website:'string',
	business_type:'string',
	business_nature:'string',

	personal_name:'string',
	personal_id:'string',
	personal_mobile:'string',
	personal_sex:'string',
	personal_name:'string',
	personal_permanent_addr:'string',
	personal_current_addr:'string',
	personal_email:'string',
	
	membership:'string',
	recieved_date:'string',
	user:'string'
},{strict:false});

