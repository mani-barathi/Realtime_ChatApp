# Utility functions
def serializeOneMessage(msg):
	data = {
		"user": msg.user,
		"text": msg.text,
		"timestamp": str(msg.timestamp)
	}
	return data

def serializeManyMessages(messages):
	results = []
	for message in messages:
		results.append(serializeOneMessage(message))
	return results