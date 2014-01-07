$(function(){
	$("form input").each(function(){
		var self = $(this);
		self.attr("name", self.attr("id"));
		if(self.attr("type") == "email"){
			self.val(Faker.Internet.email())
		}else{
			self.val(Faker.Name.findName());
		}
	});
	$("#new-member-form").on('submit', function(e){
		e.preventDefault();
		var form = $(this);
		if(form.parsley('isValid')){
			var data = form.serializeArray();
			var obj = {};
			data.forEach(function(e){
				obj[e.name] = e.value;
			});
			obj.business_type = $("#business_type label.active").text();
			obj.business_nature = $("#business_nature label.active").text();
			obj.personal_sex = $("#personal_sex label.active").text();
			obj.membership = $("#membership label.active").text();
			$.post("/members/register", obj, function(res){
				if(res.error){
					return alert(res.error);
				}
				alert("Member added");
				$("form input").each(function(){
					$(this).val('');
				})
			})
		}
	});
})
